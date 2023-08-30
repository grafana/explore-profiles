import { DateTime, RawTimeRange, TimeRange, dateTime, dateTimeParse } from '@grafana/data';

function translateToGrafanaRawTimeRangePart(pyroscopeRangePart: string) {
  // Pyroscope uses seconds from 1970 as a string, or relative format (e.g., now-5s)
  // First let's see if we can derive a number
  const asNumber = Number(pyroscopeRangePart);
  if (Number.isNaN(asNumber)) {
    // if it is not a number, we can assume it is parseable relative text format
    return pyroscopeRangePart; // Just return as is.
  }

  // Otherwise, let's get a DateTime object, after converting to milliseconds
  return dateTime(asNumber);
}

export function translatePyroscopeTimeRangeToGrafana(from: string, until: string) {
  const raw: RawTimeRange = {
    from: translateToGrafanaRawTimeRangePart(from),
    to: translateToGrafanaRawTimeRangePart(until),
  };

  const timeRange: TimeRange = {
    raw,
    from: dateTimeParse(raw.from),
    to: dateTimeParse(raw.to),
  };

  return timeRange;
}

function stringifyRawTimeRangePart(rawTimeRangePart: DateTime | string) {
  if (typeof rawTimeRangePart === 'string') {
    return rawTimeRangePart;
  }

  // The `unix` result as a string is compatible with Pyroscope's range part format
  return Math.round(rawTimeRangePart.unix() * 1000).toString();
}

export function translateGrafanaTimeRangeToPyroscope(timeRange: TimeRange) {
  const from = stringifyRawTimeRangePart(timeRange.raw.from);
  const until = stringifyRawTimeRangePart(timeRange.raw.to);

  return { from, until };
}
