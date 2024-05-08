import { TimeRange } from '@grafana/data';
import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

const LOOKUP = new Map([
  ['s', null],
  ['m', { mul: 60, target: 's' }],
  ['h', { mul: 60, target: 'm' }],
  ['d', { mul: 24, target: 'h' }],
]);

export function splitRelativeTimeRange(timeRange: TimeRange): [TimeRange, TimeRange] {
  if (timeRange.raw.to !== 'now') {
    return [timeRange, timeRange];
  }

  // Quick fix for most ranges
  // TODO: implement the logic to always split it properly
  const [, rawValue, rawUnit] = String(timeRange.raw.from).match(/now-(\d+)(.)/) || [];
  const value = Number(rawValue);
  const unit = LOOKUP.has(rawUnit) ? rawUnit : null;

  if (!value || !unit) {
    return [timeRange, timeRange];
  }

  if (!(value % 2)) {
    const mid = `now-${value / 2}${unit}`;
    return [
      translatePyroscopeTimeRangeToGrafana(`now-${value}${unit}`, mid),
      translatePyroscopeTimeRangeToGrafana(mid, 'now'),
    ];
  }

  // value is odd from now on

  const conv = LOOKUP.get(unit);
  if (!conv) {
    return [timeRange, timeRange];
  }

  const mid = `now-${(value * conv.mul) / 2}${conv.target}`;
  return [
    translatePyroscopeTimeRangeToGrafana(`now-${value}${unit}`, mid),
    translatePyroscopeTimeRangeToGrafana(mid, 'now'),
  ];
}
