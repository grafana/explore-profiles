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
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';

import { PYROSCOPE_SERIES_DATA_SOURCE } from '../pyroscope-data-sources';
import { formatSeriesToProfileMetrics } from './formatSeriesToProfileMetrics';
import { formatSeriesToServices } from './formatSeriesToServices';
import { DataSourceProxyClientBuilder } from './http/DataSourceProxyClientBuilder';
import { SeriesApiClient } from './http/SeriesApiClient';
import { seriesRepository } from './http/seriesRepository';

export class SeriesDataSource extends RuntimeDataSource {
  constructor() {
    super(PYROSCOPE_SERIES_DATA_SOURCE.type, PYROSCOPE_SERIES_DATA_SOURCE.uid);
  }

  async fetchSeries(dataSourceUid: string, timeRange: TimeRange) {
    const seriesApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, SeriesApiClient) as SeriesApiClient;

    seriesRepository.setApiClient(seriesApiClient);

    return seriesRepository.list({ timeRange });
  }

  async query(request: DataQueryRequest<{ refId: string; target: string }>): Promise<DataQueryResponse> {
    const sceneObject = request.scopedVars.__sceneObject?.value;
    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');

    const serviceToProfileMetricsMap = await this.fetchSeries(dataSourceUid, request.range);

    let values = [];

    const { target } = request.targets[0];

    switch (target) {
      case 'serviceName':
        values = formatSeriesToServices(serviceToProfileMetricsMap);
        break;

      case 'profileMetricId':
        values = formatSeriesToProfileMetrics(serviceToProfileMetricsMap);
        break;

      default:
        throw new TypeError(`Unsupported target "${target}"!`);
    }

    const gridItems = values.map(({ value, text }, index) => ({
      index,
      value,
      label: text,
      queryRunnerParams: {
        [target]: value,
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
              values: gridItems,
              config: {},
            },
          ],
          length: values.length,
        },
      ],
    };
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const sceneObject = options.scopedVars?.__sceneObject?.value;
    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');

    const serviceToProfileMetricsMap = await this.fetchSeries(dataSourceUid, options.range as TimeRange);

    switch (query) {
      case 'serviceName':
        return formatSeriesToServices(serviceToProfileMetricsMap);

      case 'profileMetricId':
        return formatSeriesToProfileMetrics(serviceToProfileMetricsMap);

      default:
        throw new TypeError(`Unsupported query "${query}"!`);
    }
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
