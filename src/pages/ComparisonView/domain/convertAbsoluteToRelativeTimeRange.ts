import { TimeRange, toUtc } from '@grafana/data';

import { RelativeUnit } from './getRelativeUnitForSync';
import { isRelativeTimeRange } from './isRelativeTimeRange';

const floorTenSeconds = (seconds: number): number => Math.floor(seconds / 10) * 10;
const ceilTenSeconds = (seconds: number): number => Math.ceil(seconds / 10) * 10;

// eslint-disable-next-line sonarjs/cognitive-complexity
export function convertAbsoluteToRelativeTimeRange(absoluteTimeRange: TimeRange, unit: RelativeUnit): TimeRange {
  if (isRelativeTimeRange(absoluteTimeRange)) {
    throw new TypeError(
      `The argument received is not an absolute time range (${absoluteTimeRange.raw.from}/${absoluteTimeRange.raw.to})!`
    );
  }

  const now = toUtc().unix();

  const from = absoluteTimeRange.from.utc();
  const fromDiff = ceilTenSeconds(now - from.unix());

  const to = absoluteTimeRange.to.utc();
  const toDiffRaw = now - to.unix();
  const toDiff = toDiffRaw < 0 ? 0 : floorTenSeconds(now - to.unix());

  let raw = { from: '', to: '' };

  switch (unit) {
    case 's':
      raw = {
        from: `now-${fromDiff}${unit}`,
        to: toDiff > 0 ? `now-${toDiff}${unit}` : 'now',
      };
      break;

    case 'm':
      raw = {
        from: `now-${Math.floor(fromDiff / 60)}${unit}`,
        to: toDiff > 0 ? `now-${Math.floor(toDiff / 60)}${unit}` : 'now',
      };
      break;

    case 'h':
      raw = {
        from: `now-${Math.floor(fromDiff / 3600)}${unit}`,
        to: toDiff > 0 ? `now-${Math.floor(toDiff / 3600)}${unit}` : 'now',
      };
      break;

    default:
      throw new Error(`Unknown unit "${unit}"!`);
  }

  return {
    raw,
    from: absoluteTimeRange.from,
    to: absoluteTimeRange.to,
  };
}
