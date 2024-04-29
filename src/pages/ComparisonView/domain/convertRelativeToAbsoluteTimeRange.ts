import { TimeRange } from '@grafana/data';

export function convertRelativeToAbsoluteTimeRange(relativeTimeRange: TimeRange): TimeRange {
  return {
    raw: {
      from: relativeTimeRange.from,
      to: relativeTimeRange.to,
    },
    from: relativeTimeRange.from,
    to: relativeTimeRange.to,
  };
}
