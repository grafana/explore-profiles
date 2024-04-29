import { TimeRange } from '@grafana/data';

export const isRelativeTimeRange = (timeRange: TimeRange): boolean => {
  const { from, to } = timeRange.raw;
  return String(from).includes('now') && String(to).includes('now');
};
