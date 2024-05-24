import {
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  getDefaultTimeRange,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';

export class ProfileMetricsDataSource extends RuntimeDataSource {
  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const profileMetrics = await this.metricFindQuery('list', { range: request.range });
    const values = profileMetrics.map(({ value }) => value);

    return {
      state: LoadingState.Done,
      data: [
        {
          fields: [
            {
              name: 'ProfileMetrics',
              type: FieldType.string,
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
    const services = await servicesApiClient.list({ timeRange: options.range || getDefaultTimeRange() });

    const allProfileMetricsMap = new Map<ProfileMetric['id'], ProfileMetric>();

    for (const profileMetrics of services.values()) {
      for (const [id, metric] of profileMetrics) {
        allProfileMetricsMap.set(id, metric);
      }
    }

    return Array.from(allProfileMetricsMap.values())
      .sort((a, b) => a.type.localeCompare(b.type))
      .map(({ id, type, group }) => ({
        value: id,
        text: `${type} (${group})`,
      }));
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
