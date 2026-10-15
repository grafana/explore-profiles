import { dateTime, TimeRange } from '@grafana/data';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { SeriesApiClient } from '../SeriesApiClient';
import { seriesRepository } from '../seriesRepository';

const params = { timeRange: { from: dateTime(1700000000000), to: dateTime(1700000600000) } as TimeRange };

function buildApiClient(dataSourceUid: string) {
  return {
    getBaseUrl: async () => `/api/datasources/proxy/uid/${dataSourceUid}`,
    list: jest.fn().mockResolvedValue({ services: new Map([[dataSourceUid, new Map()]]), profileMetrics: new Map() }),
  } as unknown as SeriesApiClient;
}

describe('seriesRepository', () => {
  beforeEach(() => {
    seriesRepository.setCacheClient(new MemoryCacheClient());
  });

  it('should fetch once while a previous base URL lookup is in flight', async () => {
    const apiClient = buildApiClient('pyro-a');
    seriesRepository.setApiClient(apiClient);

    await Promise.all([seriesRepository.list(params), seriesRepository.list(params)]);

    expect(apiClient.list).toHaveBeenCalledTimes(1);
  });

  it('should return data from the data source selected while a previous base URL lookup is in flight', async () => {
    seriesRepository.setApiClient(buildApiClient('pyro-a'));
    const resultA = seriesRepository.list(params);

    seriesRepository.setApiClient(buildApiClient('pyro-b'));
    const resultB = seriesRepository.list(params);

    const [, { services }] = await Promise.all([resultA, resultB]);

    expect([...services.keys()]).toEqual(['pyro-b']);
  });
});
