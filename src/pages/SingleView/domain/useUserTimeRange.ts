import { useCallback, useEffect, useState } from 'react';

import { TimeRange } from '../../../shared/types/TimeRange';

function parseTimeRangeFromUrl() {
  const searchParams = new URLSearchParams(document.location.search);
  return {
    from: searchParams.get('from') || 'now-5m',
    until: searchParams.get('until') || 'now',
  };
}

export function useUserTimeRange(): [TimeRange, (from: string, until: string) => void] {
  const [timeRange, setInternalTimeRange] = useState<TimeRange>(parseTimeRangeFromUrl());

  const setTimeRange = useCallback((from: string, until: string) => {
    // TODO: FIXME
    setInternalTimeRange({ from, until });

    const newUrl = new URL(document.location.toString());
    const searchParams = new URLSearchParams(newUrl.search);

    searchParams.set('from', from);
    searchParams.set('until', until);
    newUrl.search = searchParams.toString();

    history.pushState(null, '', newUrl.toString());
  }, []);

  const onPopState = useCallback(() => {
    setInternalTimeRange(parseTimeRangeFromUrl());
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onPopState]);

  return [timeRange, setTimeRange];
}
