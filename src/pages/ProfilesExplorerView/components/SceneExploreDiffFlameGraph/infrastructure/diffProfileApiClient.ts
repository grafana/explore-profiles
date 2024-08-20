import { dateTimeParse, TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';

type DiffProfileResponse = FlamebearerProfile;

type GetParams = {
  leftQuery: string;
  leftTimeRange: TimeRange;
  rightQuery: string;
  rightTimeRange: TimeRange;
  maxNodes: number | null;
};

class DiffProfileApiClient extends ApiClient {
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

export const diffProfileApiClient = new DiffProfileApiClient();
