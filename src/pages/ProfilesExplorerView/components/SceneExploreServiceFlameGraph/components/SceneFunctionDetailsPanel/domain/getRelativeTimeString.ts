// Array reprsenting one minute, hour, day, week, month, etc in seconds
const CUTOFFS = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];

// Array equivalent to the above but in the string representation of the units
const UNITS: Intl.RelativeTimeFormatUnit[] = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];

// Intl.RelativeTimeFormat do its magic
const RTF = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/**
 * Convert a date to a relative time string, such as "a minute ago", "in 2 hours", "yesterday", "3 months ago", etc.
 *
 * Adapted from https://www.builder.io/blog/relative-time
 */
export function getRelativeTimeString(date: Date): string {
  const timeMs = date.getTime();

  // Get the amount of seconds between the given date and now
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  // Grab the ideal cutoff unit
  const unitIndex = CUTOFFS.findIndex((cutoff) => cutoff > Math.abs(deltaSeconds));

  // Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
  // is one day in seconds, so we can divide our seconds by this to get the # of days
  const divisor = unitIndex ? CUTOFFS[unitIndex - 1] : 1;

  // Intl.RelativeTimeFormat do its magic
  return RTF.format(Math.floor(deltaSeconds / divisor), UNITS[unitIndex]);
}
