import { dateTimeParse, TimeRange } from '@grafana/data';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';

import { DataSourceProxyClient } from '../../../../../infrastructure/series/http/DataSourceProxyClient';

type DiffProfileResponse = FlamebearerProfile;

type GetParams = {
  leftQuery: string;
  leftTimeRange: TimeRange;
  rightQuery: string;
  rightTimeRange: TimeRange;
  maxNodes: number | null;
};

export class DiffProfileApiClient extends DataSourceProxyClient {
  constructor(options: { dataSourceUid: string }) {
    super(options);
  }

  async get(params: GetParams): Promise<DiffProfileResponse> {
    // /pyroscope/render-diff requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
    const leftFrom = Number(dateTimeParse(params.leftTimeRange.raw.from).unix()) * 1000;
    const leftUntil = Number(dateTimeParse(params.leftTimeRange.raw.to).unix()) * 1000;
    const rightFrom = Number(dateTimeParse(params.rightTimeRange.raw.from).unix()) * 1000;
    const rightUntil = Number(dateTimeParse(params.rightTimeRange.raw.to).unix()) * 1000;

    const searchParams = new URLSearchParams({
      leftQuery: params.leftQuery,
      leftFrom: String(leftFrom),
      leftUntil: String(leftUntil),
      rightQuery: params.rightQuery,
      rightFrom: String(rightFrom),
      rightUntil: String(rightUntil),
    });

    if (params.maxNodes) {
      searchParams.set('max-nodes', String(params.maxNodes));
    }

    const response = await this.fetch(`/pyroscope/render-diff?${searchParams.toString()}`);

    const json = await response.json();

    return json;
  }
}
