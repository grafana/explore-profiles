import { dateMath, DateTime, TimeRange } from '@grafana/data';
import { TimeZone } from '@grafana/schema';

/* Copied from https://github.com/grafana/scenes/blob/main/packages/scenes/src/utils/evaluateTimeRange.ts */

export function evaluateTimeRange(
  from: string | DateTime,
  to: string | DateTime,
  timeZone: TimeZone,
  fiscalYearStartMonth?: number,
  delay?: string
): TimeRange {
  const hasDelay = delay && to === 'now';

  return {
    from: dateMath.parse(from, false, timeZone, fiscalYearStartMonth)!,
    to: dateMath.parse(hasDelay ? 'now-' + delay : to, true, timeZone, fiscalYearStartMonth)!,
    raw: {
      from: from,
      to: to,
    },
  };
}
