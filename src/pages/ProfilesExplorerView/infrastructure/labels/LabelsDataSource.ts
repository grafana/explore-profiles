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
import { LabelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { computeRoundedTimeRange } from '../../helpers/computeRoundedTimeRange';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../pyroscope-data-sources';
import { DataSourceProxyClientBuilder } from '../series/http/DataSourceProxyClientBuilder';
import { LabelsApiClient } from './http/LabelsApiClient';

// we instantiate a new repository here to prevent unwanted interaction with the QueryBuilder
// indeed, when entering the "idle" state, the QueryBuilder state machine will call cancelAllLoad()
// that will abort any ApiClient in-flight request
const labelsRepository = new LabelsRepository({
  apiClient: new LabelsApiClient({ dataSourceUid: '' }),
  cacheClient: new MemoryCacheClient(),
});

export class LabelsDataSource extends RuntimeDataSource {
  static MAX_TIMESERIES_LABEL_VALUES = 10;

  constructor() {
    super(PYROSCOPE_LABELS_DATA_SOURCE.type, PYROSCOPE_LABELS_DATA_SOURCE.uid);
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

  getParams(options: LegacyMetricFindQueryOptions) {
    const { scopedVars, range } = options;
    const sceneObject = scopedVars?.__sceneObject?.value as GroupByVariable;

    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');
    const serviceName = sceneGraph.interpolate(sceneObject, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(sceneObject, '$profileMetricId');

    // we could interpolate ad hoc filters, but the Labels exploration type would reload all labels each time they are modified
    // const filters = sceneGraph.interpolate(sceneObject, '$filters');
    // const pyroscopeQuery = `${profileMetricId}{service_name="${serviceName}",${filters}}`;
    const query = `${profileMetricId}{service_name="${serviceName}"}`;

    const { from, to } = computeRoundedTimeRange(range as TimeRange);

    return {
      dataSourceUid,
      serviceName,
      profileMetricId,
      query,
      from,
      to,
    };
  }

  async metricFindQuery(_: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const sceneObject = options.scopedVars?.__sceneObject?.value as GroupByVariable;

    // save bandwidth
    if (!sceneObject.isActive) {
      return [];
    }

    const { dataSourceUid, serviceName, profileMetricId, query, from, to } = this.getParams(options);

    if (!serviceName || !profileMetricId) {
      console.warn(
        'LabelsDataSource: either serviceName="%s" and/or profileMetricId="%s" is empty! Discarding request.',
        serviceName,
        profileMetricId
      );
      return [];
    }

    labelsRepository.setApiClient(
      DataSourceProxyClientBuilder.build(dataSourceUid, LabelsApiClient) as LabelsApiClient
    );

    const labels = await labelsRepository.listLabels({ query, from, to });

    const sortedLabelsWithCounts = (
      await Promise.all(
        labels
          .filter(({ value }) => !isPrivateLabel(value))
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(async ({ value }) => {
            const values = (await labelsRepository.listLabelValues({ query, from, to, label: value })).map(
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
