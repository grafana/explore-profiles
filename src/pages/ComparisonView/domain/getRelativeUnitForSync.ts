import { TimeRange } from '@grafana/data';

const SECONDS_6_HOURS = 6 * 60 * 60;
const SECONDS_7_DAYS = 7 * 24 * 60 * 60;

export type RelativeUnit = 's' | 'm' | 'h';

export function getRelativeUnitForSync(mainTimeRange: TimeRange): RelativeUnit {
  const diff = mainTimeRange.to.unix() - mainTimeRange.from.unix();

  if (diff < SECONDS_6_HOURS) {
    return 's';
  }

  if (diff < SECONDS_7_DAYS) {
    return 'm';
  }

  return 'h';
}
