import { TimeRange } from '@grafana/data';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';

import { DataSourceProxyClient } from '../series/http/DataSourceProxyClient';

type DiffProfileResponse = string | FlamebearerProfile;

type GetParams = {
  query: string;
  timeRange: TimeRange;
  format: 'dot' | 'json';
  maxNodes: number;
};

export class ProfileApiClient extends DataSourceProxyClient {
  constructor(options: { dataSourceUid: string }) {
    super(options);
  }

  async get(params: GetParams): Promise<DiffProfileResponse> {
    const searchParams = new URLSearchParams({
      query: params.query,
      from: String(params.timeRange.from.unix() * 1000),
      until: String(params.timeRange.to.unix() * 1000),
      format: params.format,
    });

    if (params.maxNodes) {
      searchParams.set('max-nodes', String(params.maxNodes));
    }

    const response = await this.fetch(`/pyroscope/render?${searchParams.toString()}`);

    switch (params.format) {
      case 'dot':
        return response.text();

      case 'json':
        return response.json();

      default:
        throw new TypeError(`Unknown format "${params.format}"!`);
    }
  }
}
