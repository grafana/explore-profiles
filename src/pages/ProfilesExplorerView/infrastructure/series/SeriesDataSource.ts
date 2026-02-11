import {
  DataQueryResponse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { logger } from '@shared/infrastructure/tracking/logger';

import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { PYROSCOPE_SERIES_DATA_SOURCE } from '../pyroscope-data-sources';
import { formatSeriesToProfileMetrics } from './formatSeriesToProfileMetrics';
import { formatSeriesToServices } from './formatSeriesToServices';
import { safeInterpolate } from './helpers/safeInterpolate';
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

  async fetchSeriesWithPreset(
    dataSourceUid: string,
    timeRange: TimeRange,
    presetLabels: string[],
    variableName?: string
  ) {
    seriesRepository.setApiClient(DataSourceProxyClientBuilder.build(dataSourceUid, SeriesApiClient));

    try {
      return await seriesRepository.listWithPreset({ timeRange, presetLabels });
    } catch (error) {
      logger.error(error as Error, {
        info: 'Error while loading Pyroscope series with preset!',
        variableName: variableName || '',
        presetLabels: presetLabels.join(','),
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

  /**
   * Parses a preset query string like "$dataSource preset [label1,label2] services"
   * Returns the preset labels array or null if not a preset query
   */
  parsePresetQuery(query: string): string[] | null {
    const match = query.match(/\$dataSource preset \[([^\]]+)\]/);
    if (!match) {
      return null;
    }
    return match[1].split(',').map((s) => s.trim());
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const sceneObject = options.scopedVars?.__sceneObject?.valueOf() as ServiceNameVariable | ProfileMetricVariable;

    let dataSourceUid = safeInterpolate(sceneObject, '$dataSource');
    const serviceName = safeInterpolate(sceneObject, '$serviceName');
    const profileMetricId = safeInterpolate(sceneObject, '$profileMetricId');

    // Fallback to default datasource if interpolation not ready yet
    if (!dataSourceUid) {
      dataSourceUid = ApiClient.selectDefaultDataSource().uid as string;
    }

    // Check if this is a preset query
    const presetLabels = this.parsePresetQuery(query);
    if (presetLabels) {
      const pyroscopeSeries = await this.fetchSeriesWithPreset(
        dataSourceUid,
        options.range as TimeRange,
        presetLabels,
        options.variable?.name
      );

      if (query.includes('$profileMetricId services')) {
        return formatSeriesToServices(pyroscopeSeries, profileMetricId);
      }
      return formatSeriesToServices(pyroscopeSeries);
    }

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
