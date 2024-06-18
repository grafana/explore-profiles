import {
  DataQueryRequest,
  DataQueryResponse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import {
  getProfileMetric,
  ProfileMetric,
  ProfileMetricId,
} from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { servicesRepository } from '@shared/infrastructure/services/servicesRepository';

export class ProfileMetricsDataSource extends RuntimeDataSource {
  static getProfileMetricLabel(profileMetricId: string) {
    const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
    const { group, type } = profileMetric;

    return `${type} (${group})`;
  }

  async fetchProfileMetrics(timeRange: TimeRange) {
    const services = await servicesRepository.listServices(timeRange);

    const allProfileMetricsMap = new Map<ProfileMetric['id'], ProfileMetric>();

    for (const profileMetrics of services.values()) {
      for (const [id, metric] of profileMetrics) {
        allProfileMetricsMap.set(id, metric);
      }
    }

    return Array.from(allProfileMetricsMap.values())
      .sort((a, b) => a.group.localeCompare(b.group))
      .map(({ id, type, group }) => ({
        value: id,
        text: `${type} (${group})`,
      }));
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const profileMetrics = await this.fetchProfileMetrics(request.range);

    const values = profileMetrics.map(({ value, text }, index) => ({
      index,
      value,
      label: text,
      queryRunnerParams: {
        profileMetricId: value,
      },
    }));

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'ProfileMetrics',
          fields: [
            {
              name: 'ProfileMetric',
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
    return this.fetchProfileMetrics(options.range as TimeRange);
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
