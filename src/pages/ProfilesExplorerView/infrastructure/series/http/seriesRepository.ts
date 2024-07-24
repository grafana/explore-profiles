import { TimeRange } from '@grafana/data';
import { AbstractRepository } from '@shared/infrastructure/AbstractRepository';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { computeRoundedTimeRange } from '../../../helpers/computeRoundedTimeRange';
import { PyroscopeSeries, SeriesApiClient } from './SeriesApiClient';

class SeriesRepository extends AbstractRepository<SeriesApiClient, MemoryCacheClient> {
  constructor(options: { cacheClient: MemoryCacheClient }) {
    super(options);
  }

  async list(options: { timeRange: TimeRange }): Promise<PyroscopeSeries> {
    const { from, to } = computeRoundedTimeRange(options.timeRange);

    const cacheParams = [this.apiClient!.baseUrl, from, to];

    const responseFromCacheP = this.cacheClient!.get(cacheParams);
    if (responseFromCacheP) {
      const { services, profileMetrics } = await responseFromCacheP;

      if (!services.size && !profileMetrics.size) {
        this.cacheClient!.delete(cacheParams);
      }

      return { services, profileMetrics };
    }

    const fetchP = this.apiClient!.list({ from, to });
    this.cacheClient!.set(cacheParams, fetchP);

    try {
      const { services, profileMetrics } = await fetchP;
      return { services, profileMetrics };
    } catch (error) {
      this.cacheClient!.delete(cacheParams);
      throw error;
    }
  }
}

export const seriesRepository = new SeriesRepository({
  cacheClient: new MemoryCacheClient(),
});
