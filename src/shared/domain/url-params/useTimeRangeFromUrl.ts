import { TimeRange } from '@grafana/data';

import { translateGrafanaTimeRangeToPyroscope } from '../translation';
import { parseTimeRangeFromUrl } from './parseTimeRangeFromUrl';
import { useUrlSearchParams } from './useUrlSearchParams';

type TargetTimeline = 'main' | 'left' | 'right';

const PARAM_NAMES = new Map<TargetTimeline, string[]>([
  ['main', ['from', 'to']],
  ['left', ['leftFrom', 'leftUntil']],
  ['right', ['rightFrom', 'rightUntil']],
]);

const DEFAULT_TIMERANGE_VALUES = new Map<string, string>([
  ['from', 'now-30m'],
  ['to', 'now'],
  // we don't specify default values for left/right because we will split/sync them later if they are not already set in the URL
  // (see in src/pages/ComparisonView/domain/useDefaultComparisonParamsFromUrl.ts)
  ['leftFrom', ''],
  ['leftUntil', ''],
  ['rightFrom', ''],
  ['rightUntil', ''],
]);

function setDefaultTimeRange(
  paramNames: string[],
  searchParams: URLSearchParams,
  setTimeRange: (newTimeRange: TimeRange, useRawValues?: boolean) => void
): TimeRange {
  let shouldUpdateUrl = false;

  for (const key of paramNames) {
    // only empty values will be set to default values
    if (searchParams.has(key)) {
      continue;
    }

    const defaultValue = DEFAULT_TIMERANGE_VALUES.get(key);
    if (defaultValue === undefined) {
      throw new TypeError(`Undefined default value for URL search parameter "${key}"!`);
    }

    if (defaultValue === '') {
      continue;
    }

    searchParams.set(key, defaultValue);

    shouldUpdateUrl = true;
  }

  const defaultTimeRange = parseTimeRangeFromUrl(paramNames, searchParams);

  if (shouldUpdateUrl) {
    setTimeRange(defaultTimeRange);
  }

  return defaultTimeRange;
}

function buildHook(targetTimeline: TargetTimeline) {
  const paramNames = PARAM_NAMES.get(targetTimeline);
  if (paramNames === undefined) {
    throw new TypeError(`Undefined parameter names for "${targetTimeline}" timeline!`);
  }

  return function useTimeRangeFromUrl(): [TimeRange, (newTimeRange: TimeRange, useRawValues?: boolean) => void] {
    const { searchParams, pushNewUrl } = useUrlSearchParams();

    const setTimeRange = (newTimeRange: TimeRange, useRawValues?: boolean) => {
      const pyroscopeTimeRange = useRawValues
        ? { from: String(newTimeRange.raw.from), until: String(newTimeRange.raw.to) }
        : translateGrafanaTimeRangeToPyroscope(newTimeRange);

      pushNewUrl({
        [paramNames[0]]: pyroscopeTimeRange.from,
        [paramNames[1]]: pyroscopeTimeRange.until,
      });
    };

    const timeRange = setDefaultTimeRange(paramNames, searchParams, setTimeRange);

    return [timeRange, setTimeRange];
  };
}

export const useTimeRangeFromUrl = buildHook('main');
export const useLeftTimeRangeFromUrl = buildHook('left');
export const useRightTimeRangeFromUrl = buildHook('right');
