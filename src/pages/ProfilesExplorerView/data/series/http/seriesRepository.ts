import { TimeRange } from '@grafana/data';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { AbstractRepository } from './AbstractRepository';
import { SeriesApiClient, ServiceToProfileMetricsMap } from './SeriesApiClient';

class SeriesRepository extends AbstractRepository<SeriesApiClient, MemoryCacheClient> {
  constructor(options: { cacheClient: MemoryCacheClient }) {
    super(options);
  }

  async list(options: { timeRange: TimeRange }): Promise<ServiceToProfileMetricsMap> {
    const { timeRange } = options;

    // round to 10s
    const from = Math.floor((timeRange.from.valueOf() || 0) / 10000) * 10000;
    const to = Math.floor((timeRange.to.valueOf() || 0) / 10000) * 10000;

    const cacheParams = [from, to];

    const servicesFromCacheP = this.cacheClient!.get(cacheParams);

    if (servicesFromCacheP) {
      const services = await servicesFromCacheP;

      if (!services.size) {
        this.cacheClient!.delete(cacheParams);
      }

      return services;
    }

    const fetchP = this.apiClient!.list({ from, to });
    this.cacheClient!.set(cacheParams, fetchP);

    try {
      const services = await fetchP;
      return services;
    } catch (error) {
      this.cacheClient!.delete(cacheParams);
      throw error;
    }
  }
}

export const seriesRepository = new SeriesRepository({
  cacheClient: new MemoryCacheClient(),
});
