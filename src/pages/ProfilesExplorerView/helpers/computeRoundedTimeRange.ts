import { TimeRange } from '@grafana/data';

export function computeRoundedTimeRange(timeRange: TimeRange) {
  // round to 10s
  return {
    from: Math.floor((timeRange.from.valueOf() || 0) / 10000) * 10000,
    to: Math.floor((timeRange.to.valueOf() || 0) / 10000) * 10000,
  };
}
