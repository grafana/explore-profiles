import { TimeRange } from '@grafana/data';

import { DataSourceProxyClient } from '../../../infrastructure/series/http/DataSourceProxyClient';

// dot format returns string (TODO: json format later)
type DiffProfileResponse = string;

type GetParams = {
  query: string;
  timeRange: TimeRange;
  format: string; // dot (TODO: json)
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

    const text = await response.text();

    return text;
  }
}
