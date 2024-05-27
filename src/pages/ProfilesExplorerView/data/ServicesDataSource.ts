import {
  DataQueryRequest,
  DataQueryResponse,
  dateTimeParse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';

export class ServicesDataSource extends RuntimeDataSource {
  static fetchServices(timeRange: TimeRange) {
    const from = timeRange.from.valueOf();
    const to = timeRange.to.valueOf();

    const pyroscopeTimeRange = {
      from: dateTimeParse(from),
      to: dateTimeParse(to),
      raw: { from: dateTimeParse(from), to: dateTimeParse(to) },
    };

    console.log('*** pyroscopeTimeRange', pyroscopeTimeRange.raw);

    return servicesApiClient.list({ timeRange: pyroscopeTimeRange });
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const services = await this.metricFindQuery('list', { range: request.range });

    const values = services.map(({ value }) => ({ value, label: value }));

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Services',
          fields: [
            {
              name: 'serviceName',
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
    const services = await ServicesDataSource.fetchServices(options.range as TimeRange);

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
