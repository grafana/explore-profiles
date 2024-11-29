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
import { logger } from '@shared/infrastructure/tracking/logger';

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

  async fetchSeries(dataSourceUid: string, timeRange: TimeRange, variableName?: string) {
    seriesRepository.setApiClient(DataSourceProxyClientBuilder.build(dataSourceUid, SeriesApiClient));

    try {
      return await seriesRepository.list({ timeRange });
    } catch (error) {
      logger.error(error as Error, {
        info: 'Error while loading Pyroscope series!',
        variableName: variableName || '',
      });

      throw error;
    }
  }

  async query(): Promise<DataQueryResponse> {
    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'PyroscopeSeries',
          fields: [
            {
              name: 'PyroscopeSeries',
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
    const sceneObject = options.scopedVars?.__sceneObject?.value;

    const dataSourceUid = sceneGraph.interpolate(sceneObject, '$dataSource');
    const serviceName = sceneGraph.interpolate(sceneObject, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(sceneObject, '$profileMetricId');

    const pyroscopeSeries = await this.fetchSeries(dataSourceUid, options.range as TimeRange, options.variable?.name);

    switch (query) {
      // queries that depend only on the selected data source
      case '$dataSource and all services':
        return formatSeriesToServices(pyroscopeSeries);

      case '$dataSource and all profile metrics':
        return formatSeriesToProfileMetrics(pyroscopeSeries);

      // queries that depend on the selected profile metric or the selected service
      case '$dataSource and only $profileMetricId services':
        return formatSeriesToServices(pyroscopeSeries, profileMetricId);

      case '$dataSource and only $serviceName profile metrics':
        return formatSeriesToProfileMetrics(pyroscopeSeries, serviceName);

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
