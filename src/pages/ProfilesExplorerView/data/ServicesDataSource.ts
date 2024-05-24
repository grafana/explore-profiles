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
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';

export class ServicesDataSource extends RuntimeDataSource {
  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const services = await this.metricFindQuery('list', { range: request.range });
    const values = services.map(({ value }) => value);

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

    return Array.from(services.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((serviceName) => ({
        text: serviceName,
        value: serviceName,
      }));
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
