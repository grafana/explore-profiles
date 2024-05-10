import { TimeRange } from '@grafana/data';
import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useEffect } from 'react';

import { areCompatibleQueries } from './areCompatibleQueries';
import { splitTimeRanges } from './splitTimeRanges';
import { syncTimelineModes } from './syncTimelineModes';

const isTimeRangeSet = (timeRange: TimeRange): boolean => Boolean(timeRange.from.unix() && timeRange.to.unix());

export function useDefaultComparisonParamsFromUrl() {
  const [query] = useQueryFromUrl();
  const [mainTimeRange] = useTimeRangeFromUrl();
  const { left, right } = useLeftRightParamsFromUrl();

  // we set the default values only when mounting
  useEffect(() => {
    if (!areCompatibleQueries(query, left.query, right.query)) {
      left.setQuery(query);
      right.setQuery(query);
    }

    if (!isTimeRangeSet(left.timeRange) || !isTimeRangeSet(right.timeRange)) {
      splitTimeRanges(mainTimeRange, left, right);
    } else {
      syncTimelineModes(mainTimeRange, left, right);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    left,
    right,
  };
}
