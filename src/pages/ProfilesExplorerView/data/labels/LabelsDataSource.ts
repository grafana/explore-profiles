import {
  DataQueryResponse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';

import { computeRoundedTimeRange } from '../../helpers/computeRoundedTimeRange';
import { GroupByVariable } from '../../variables/GroupByVariable/GroupByVariable';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../pyroscope-data-sources';
import { DataSourceProxyClientBuilder } from '../series/http/DataSourceProxyClientBuilder';
import { LabelsApiClient } from './http/LabelsApiClient';

export class LabelsDataSource extends RuntimeDataSource {
  static MAX_TIMESERIES_LABEL_VALUES = 10;

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

  async query(): Promise<DataQueryResponse> {
    return {
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
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const { scopedVars, range } = options;
    const sceneObject = scopedVars?.__sceneObject?.value as GroupByVariable;

    if (!sceneObject.isActive) {
      return [];
    }

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

    // we could interpolate ad hoc filters, but the Service labels exploration type would reload all labels each time they are modified
    // const filters = sceneGraph.interpolate(sceneObject, '$filters');
    // const pyroscopeQuery = `${profileMetricId}{service_name="${serviceName}",${filters}}`;
    const pyroscopeQuery = `${profileMetricId}{service_name="${serviceName}"}`;

    const { from, to } = computeRoundedTimeRange(range as TimeRange);

    const labels = await this.fetchLabels(dataSourceUid, pyroscopeQuery, from, to);

    const sortedLabelsWithCounts = (
      await Promise.all(
        labels
          .filter(({ value }) => !isPrivateLabel(value))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(async ({ value }) => {
            const values = (await this.fetchLabelValues(dataSourceUid, pyroscopeQuery, from, to, value)).map(
              ({ value }) => value
            );
            const count = values.length;

            return {
              // TODO: check if there's a better way
              value: JSON.stringify({
                value,
                groupBy: {
                  label: value,
                  values,
                },
              }),
              text: `${value} (${count})`,
              count,
            };
          })
      )
    )
      .sort((a, b) => b.count - a.count)
      .map(({ value, text }) => ({ value, text }));

    return [
      // we do this here because GroupByVariable may set its default value to the 1st element automatically
      {
        value: 'all',
        text: 'All',
      },
      ...sortedLabelsWithCounts,
    ];
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
