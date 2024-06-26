import {
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  ScopedVar,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';

import { computeRoundedTimeRange } from '../../helpers/computeRoundedTimeRange';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../pyroscope-data-sources';
import { DataSourceProxyClientBuilder } from '../series/http/DataSourceProxyClientBuilder';
import { LabelsApiClient } from './http/LabelsApiClient';

const EMPTY_QUERY_RETURN_VALUE = {
  state: LoadingState.Done,
  data: [
    {
      name: 'Labels',
      fields: [
        {
          name: 'Label',
          type: FieldType.other,
          values: [],
          config: {},
        },
      ],
      length: 0,
    },
  ],
};

export class LabelsDataSource extends RuntimeDataSource {
  static MAX_TIMESERIES_LABEL_VALUES = 10;

  static formatItemLabel(labelName: string, labelValuesCount: number) {
    return labelValuesCount > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
      ? `${labelName} (${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES}+)`
      : `${labelName} (${labelValuesCount})`;
  }

  constructor() {
    super(PYROSCOPE_LABELS_DATA_SOURCE.type, PYROSCOPE_LABELS_DATA_SOURCE.uid);
  }

  async fetchLabels(dataSourceUid: string, query: string, from: number, to: number) {
    const labelsApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, LabelsApiClient) as LabelsApiClient;

    labelsRepository.setApiClient(labelsApiClient);

    return labelsRepository.listLabels({ query, from, to });
  }

  async fetchLabelValues(dataSourceUid: string, query: string, from: number, to: number, label: string) {
    const labelsApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, LabelsApiClient) as LabelsApiClient;

    labelsRepository.setApiClient(labelsApiClient);

    return labelsRepository.listLabelValues({ query, from, to, label });
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const sceneObject = (request.scopedVars.__sceneObject as ScopedVar).value;

    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');
    const serviceName = sceneGraph.interpolate(sceneObject, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(sceneObject, '$profileMetricId');

    if (!serviceName || !profileMetricId) {
      console.warn(
        'LabelsDataSource: either serviceName="%s" and/or profileMetricId="%s" is empty! Discarding request.',
        serviceName,
        profileMetricId
      );

      return EMPTY_QUERY_RETURN_VALUE;
    }

    const pyroscopeQuery = `${profileMetricId}{service_name="${serviceName}"}`;

    const { from, to } = computeRoundedTimeRange(request.range);

    const groupByLabel = sceneGraph.interpolate(sceneObject, '$groupBy');
    if (!groupByLabel) {
      console.warn('LabelsDataSource: groupByLabel is empty! Discarding request.');

      return EMPTY_QUERY_RETURN_VALUE;
    }

    if (groupByLabel !== 'all') {
      const labelValues = await this.fetchLabelValues(dataSourceUid, pyroscopeQuery, from, to, groupByLabel);

      const values = labelValues.map(({ value, label }, index) => ({
        index,
        value,
        label,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          filters: [{ key: groupByLabel, operator: '=', value }],
        },
      }));

      return {
        state: LoadingState.Done,
        data: [
          {
            name: 'Labels',
            fields: [
              {
                name: 'Label',
                type: FieldType.other,
                values,
                config: {},
              },
            ],
            length: values.length,
          },
        ],
      };
    }

    const labels = await this.fetchLabels(dataSourceUid, pyroscopeQuery, from, to);

    const labelsWithCounts = await Promise.all(
      labels.map(async ({ value, label: text }) => {
        const labelValues = await this.fetchLabelValues(dataSourceUid, pyroscopeQuery, from, to, value);
        return {
          value,
          text,
          labelValues,
          count: labelValues.length,
        };
      })
    );

    const values = labelsWithCounts
      .sort((a, b) => b.count - a.count)
      .map(({ value, text, count, labelValues }, index) => {
        const allValues = labelValues.map(({ value }) => value);

        return {
          index,
          value,
          label: LabelsDataSource.formatItemLabel(text, count),
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            groupBy: {
              label: value,
              values: allValues.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES),
              allValues,
            },
          },
        };
      });

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Labels',
          fields: [
            {
              name: 'Label',
              type: FieldType.other,
              values,
              config: {},
            },
          ],
          length: values.length,
        },
      ],
    };
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const { scopedVars, range } = options;
    const sceneObject = scopedVars?.__sceneObject?.value;

    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');
    const serviceName = sceneGraph.interpolate(sceneObject, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(sceneObject, '$profileMetricId');

    if (!serviceName || !profileMetricId) {
      console.warn(
        'LabelsDataSource: either serviceName="%s" and/or profileMetricId="%s" is empty! Discarding request.',
        serviceName,
        profileMetricId
      );
      return [];
    }

    const pyroscopeQuery = `${profileMetricId}{service_name="${serviceName}"}`;

    const { from, to } = computeRoundedTimeRange(range as TimeRange);

    const labels = await this.fetchLabels(dataSourceUid, pyroscopeQuery, from, to);

    const labelsWithCounts = await Promise.all(
      labels
        .filter(({ value }) => !isPrivateLabel(value))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(async ({ value }) => {
          const labelValues = await this.fetchLabelValues(dataSourceUid, pyroscopeQuery, from, to, value);
          const count = labelValues.length;
          return {
            value,
            text: `${value} (${count})`,
            count,
          };
        })
    );

    const sortedLabels = labelsWithCounts.sort((a, b) => b.count - a.count).map(({ value, text }) => ({ value, text }));

    return [
      // we do this here because GroupByVariable may set its default value to the 1st element
      { value: 'all', text: 'All' },
      ...sortedLabels,
    ];
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
