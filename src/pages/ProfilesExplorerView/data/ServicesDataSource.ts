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
import { servicesRepository } from '@shared/infrastructure/services/servicesRepository';

export class ServicesDataSource extends RuntimeDataSource {
  async fetchServices(timeRange: TimeRange) {
    const services = await servicesRepository.listServices(timeRange);

    return Array.from(services.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((serviceName) => ({
        text: serviceName,
        value: serviceName,
      }));
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const services = await this.fetchServices(request.range);

    const values = services.map(({ value, text }, index) => ({
      index,
      value,
      label: text,
      queryRunnerParams: {
        serviceName: value,
      },
    }));

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Services',
          fields: [
            {
              name: 'Service',
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
    return this.fetchServices(options.range as TimeRange);
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
