import { dateTimeParse, TimeRange } from '@grafana/data';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { Services, ServicesApiClient } from './servicesApiClient';

class ServicesRepository {
  servicesApiClient: ServicesApiClient;
  cacheClient: MemoryCacheClient;

  constructor(servicesApiClient: ServicesApiClient, cacheClient: MemoryCacheClient) {
    this.servicesApiClient = servicesApiClient;
    this.cacheClient = cacheClient;
  }

  async listServices(timeRange: TimeRange): Promise<Services> {
    const from = timeRange.from.valueOf();
    const to = timeRange.to.valueOf();

    const servicesFromCacheP = this.cacheClient.get([from, to]);

    if (servicesFromCacheP) {
      const services = await servicesFromCacheP;

      if (!services.size) {
        this.cacheClient.delete([from, to]);
      }

      return services;
    }

    const pyroscopeTimeRange = {
      from: dateTimeParse(from),
      to: dateTimeParse(to),
      raw: { from: dateTimeParse(from), to: dateTimeParse(to) },
    };

    const fetchP = this.servicesApiClient.list({ timeRange: pyroscopeTimeRange });
    this.cacheClient.set([from, to], fetchP);

    try {
      const services = await fetchP;
      return services;
    } catch (error) {
      this.cacheClient.delete([from, to]);
      throw error;
    }
  }
}

export const servicesRepository = new ServicesRepository(new ServicesApiClient(), new MemoryCacheClient());
