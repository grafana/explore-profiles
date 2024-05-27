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
import {
  getProfileMetric,
  ProfileMetric,
  ProfileMetricId,
} from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';

export class ProfileMetricsDataSource extends RuntimeDataSource {
  static getProfileMetricLabel(profileMetricId: string) {
    const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
    const { group, type } = profileMetric;
    return `${type} (${group})`;
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const profileMetrics = await this.metricFindQuery('list', { range: request.range });

    const values = profileMetrics.map(({ value }) => ({
      value,
      label: ProfileMetricsDataSource.getProfileMetricLabel(value as string),
    }));

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'ProfileMetrics',
          fields: [
            {
              name: 'profileMetricId',
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
