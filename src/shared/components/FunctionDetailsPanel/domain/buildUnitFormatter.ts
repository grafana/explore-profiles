import { getValueFormat, ValueFormatter } from '@grafana/data';

type FormatUnit = 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds' | 'count' | string;

export function buildUnitFormatter(unit: FormatUnit): ValueFormatter {
  switch (unit) {
    case 'nanoseconds':
      return getValueFormat('ns');
    case 'microseconds':
      return getValueFormat('µs');
    case 'milliseconds':
      return getValueFormat('ms');
    case 'seconds':
      return getValueFormat('s');
    case 'count':
      return getValueFormat('short');
    default:
      return getValueFormat(unit);
  }
}
