import { dateTimeParse, TimeRange } from '@grafana/data';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { Timeline } from '@shared/types/Timeline';

import { ApiClient } from './http/ApiClient';

type TimelineAndProfileResponse = FlamebearerProfile & {
  timeline: Timeline;
  //   groups: null;
  //   heatmap: null;
};

export class TimeLineAndProfileApiClient extends ApiClient {
  lastTimeRange: number[] = [];

  async get(query: string, timeRange: TimeRange, maxNodes: number | null): Promise<TimelineAndProfileResponse> {
    // /pyroscope/render requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
    const from = Number(dateTimeParse(timeRange.raw.from).unix()) * 1000;
    const until = Number(dateTimeParse(timeRange.raw.to).unix()) * 1000;

    const searchParams = new URLSearchParams({
      query,
      from: String(from),
      until: String(until),
      aggregation: 'sum',
      format: 'json',
    });

    if (Number(maxNodes) > 0) {
      searchParams.set('max-nodes', String(maxNodes));
    }

    const response = await this.fetch(`/pyroscope/render?${searchParams.toString()}`);

    const json = await response.json();

    this.lastTimeRange = [from, until];

    return json;
  }

  getLastTimeRange(): number[] {
    return this.lastTimeRange;
  }
}

export const timelineAndProfileApiClient = new TimeLineAndProfileApiClient();
