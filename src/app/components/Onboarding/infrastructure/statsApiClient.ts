import { ApiClient } from '@shared/infrastructure/http/ApiClient';

export type Stats = {
  hasIngestedData: boolean;
  oldestProfileTime: number;
  newestProfileTime: number;
};

class StatsApiClient extends ApiClient {
  async get(): Promise<Stats> {
    const response = await this.fetch('/querier.v1.QuerierService/GetProfileStats', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const json = await response.json();

    return {
      hasIngestedData: json.dataIngested,
      oldestProfileTime: Number(json.oldestProfileTime),
      newestProfileTime: Number(json.newestProfileTime),
    };
  }
}

export const statsApiClient = new StatsApiClient();
