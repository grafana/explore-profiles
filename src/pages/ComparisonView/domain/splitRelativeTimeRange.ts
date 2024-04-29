import { TimeRange } from '@grafana/data';

// Currently, it defaults to the same for time range for left & right
// TODO: implement the logic to actually split it properly in two time ranges?
export function splitRelativeTimeRange(timeRange: TimeRange): [TimeRange, TimeRange] {
  return [timeRange, timeRange];
}
