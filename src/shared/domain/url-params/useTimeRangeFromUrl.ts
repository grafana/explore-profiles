import { TimeRange } from '@grafana/data';
import { useEffect, useState } from 'react';

import { translateGrafanaTimeRangeToPyroscope } from '../translation';
import { parseTimeRangeFromUrl } from './parseTimeRangeFromUrl';
import { parseUrlSearchParams } from './parseUrlSearchParams';
import { pushNewUrl } from './pushNewUrl';

const DEFAULT_TIMERANGE_PARAMS: Record<string, string> = {
  from: 'now-1h',
  until: 'now',
};

function setDefaultTimeRange(): TimeRange {
  const searchParams = parseUrlSearchParams();
  let shouldPushNewUrl = false;

  for (const key in DEFAULT_TIMERANGE_PARAMS) {
    // empty values will be set to default values
    if (!searchParams.get(key)) {
      searchParams.set(key, DEFAULT_TIMERANGE_PARAMS[key]);
      shouldPushNewUrl = true;
    }
  }

  if (shouldPushNewUrl) {
    pushNewUrl(searchParams);
  }

  return parseTimeRangeFromUrl(searchParams);
}

const setTimeRange = (newTimeRange: TimeRange) => {
  const searchParams = parseUrlSearchParams();
  const pyroscopeTimeRange = translateGrafanaTimeRangeToPyroscope(newTimeRange);
  let shouldPushNewUrl = false;

  for (const key in pyroscopeTimeRange) {
    if (searchParams.get(key) !== pyroscopeTimeRange[key as keyof typeof pyroscopeTimeRange]) {
      searchParams.set(key, pyroscopeTimeRange[key as keyof typeof pyroscopeTimeRange]);
      shouldPushNewUrl = true;
    }
  }

  if (shouldPushNewUrl) {
    pushNewUrl(searchParams);
  }
};

export function useTimeRangeFromUrl(): [TimeRange, (newTimeRange: TimeRange) => void] {
  const [timeRange, setInternalTimeRange] = useState<TimeRange>(setDefaultTimeRange());

  useEffect(() => {
    const onHistoryChange = () => {
      const newTimeRange = parseTimeRangeFromUrl();

      if (newTimeRange.from !== timeRange.from || newTimeRange.to !== timeRange.to) {
        setInternalTimeRange(newTimeRange);
      }
    };

    window.addEventListener('pushstate', onHistoryChange);
    window.addEventListener('popstate', onHistoryChange);

    return () => {
      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('pushstate', onHistoryChange);
    };
  }, [timeRange]);

  return [timeRange, setTimeRange];
}
