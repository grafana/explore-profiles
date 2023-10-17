import { AbsoluteTimeRange, DateTime, RawTimeRange, TimeRange, dateTime, dateTimeParse } from '@grafana/data';

function translateToGrafanaRawTimeRangePart(pyroscopeRangePart: string) {
  // Pyroscope uses seconds from 1970 as a string, or relative format (e.g., now-5s)
  // First let's see if we can derive a number
  const asNumber = Number(pyroscopeRangePart);
  if (Number.isNaN(asNumber)) {
    // if it is not a number, we can assume it is parseable relative text format
    return pyroscopeRangePart; // Just return as is.
  }

  // Otherwise, let's get a DateTime object, after converting to milliseconds

  // BEGIN HACK
  // First though, let's see if we've already converted to milliseconds.
  {
    // It seems the "Sync Timelines" button results in milliseconds `from`, `until` strings.
    // TODO(DJ) find the root cause of this different behavior.
    // This is an unfortunate hack -- check if we are already dealing in milliseconds.
    const testDateTime = dateTime(asNumber);
    const year = testDateTime.toDate().getFullYear();
    if (year >= 2000) {
      // Pyroscope does not support dates that are pre-Y2K.
      // We assume that if the date is Y2K or greater, it is already being expressed in milliseconds,
      // so no conversion is done.
      console.warn('Assuming date is expressed in milliseconds already', { date: pyroscopeRangePart, year });
      return dateTime(asNumber);
    }
  }
  // END HACK

  // Default case, we do need to convert to milliseconds
  return dateTime(asNumber * 1000);
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

function stringifyRawTimeRangePart(rawTimeRangePart: DateTime | string | number) {
  if (typeof rawTimeRangePart === 'string') {
    return rawTimeRangePart;
  } else if (typeof rawTimeRangePart === 'number') {
    return Math.round(rawTimeRangePart).toString();
  }

  // The `unix` result as a string is compatible with Pyroscope's range part format
  return Math.round(rawTimeRangePart.unix()).toString();
}

export function translateGrafanaTimeRangeToPyroscope(timeRange: TimeRange) {
  const from = stringifyRawTimeRangePart(timeRange.raw.from);
  const until = stringifyRawTimeRangePart(timeRange.raw.to);

  return { from, until };
}

export function translateGrafanaAbsoluteTimeRangeToPyroscope(timeRange: AbsoluteTimeRange) {
  const from = stringifyRawTimeRangePart(timeRange.from);
  const until = stringifyRawTimeRangePart(timeRange.to);

  return { from, until };
}
