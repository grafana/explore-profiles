import { dateTimeParse, TimeRange } from '@grafana/data';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { Timeline } from '@shared/types/Timeline';

import { ApiClient } from '../http/ApiClient';

type TimelineAndProfileResponse = FlamebearerProfile & {
  timeline: Timeline;
  //   groups: null;
  //   heatmap: null;
};

export class TimelineAndProfileApiClient extends ApiClient {
  lastTimeRange: number[] = [];

  async get(query: string, timeRange: TimeRange, maxNodes: number | null): Promise<TimelineAndProfileResponse> {
    // /pyroscope/render requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
    const [from, to] = this._toUnixMs(timeRange);

    const searchParams = new URLSearchParams({
      query,
      from: String(from),
      until: String(to),
      aggregation: 'sum',
      format: 'json',
    });

    if (Number(maxNodes) > 0) {
      searchParams.set('max-nodes', String(maxNodes));
    }

    const response = await this.fetch(`/pyroscope/render?${searchParams.toString()}`);
    const json = await response.json();

    this._setLastTimeRange(from, to);
    return json;
  }

  setLastTimeRange(range: TimeRange): void {
    this.lastTimeRange = this._toUnixMs(range);
  }

  getLastTimeRange(): number[] {
    if (this.lastTimeRange.length === 0) {
      throw new Error('Internal error: last time range is not set!');
    }

    return this.lastTimeRange;
  }

  private _setLastTimeRange(from: number, to: number): void {
    this.lastTimeRange = [from, to];
  }

  private _toUnixMs(range: TimeRange): number[] {
    return [Number(dateTimeParse(range.raw.from).unix()) * 1000, Number(dateTimeParse(range.raw.to).unix()) * 1000];
  }
}

export const timelineAndProfileApiClient = new TimelineAndProfileApiClient();