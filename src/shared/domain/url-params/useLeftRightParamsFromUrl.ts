import { useLeftQueryFromUrl, useRightQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useLeftTimeRangeFromUrl, useRightTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';

export function useLeftRightParamsFromUrl() {
  const [leftQuery, setLeftQuery] = useLeftQueryFromUrl();
  const [rightQuery, setRightQuery] = useRightQueryFromUrl();

  const [leftTimeRange, setLeftTimerange] = useLeftTimeRangeFromUrl();
  const [rightTimeRange, setRightTimerange] = useRightTimeRangeFromUrl();

  return {
    left: {
      query: leftQuery,
      setQuery: setLeftQuery,
      timeRange: leftTimeRange,
      setTimeRange: setLeftTimerange,
    },
    right: {
      query: rightQuery,
      setQuery: setRightQuery,
      timeRange: rightTimeRange,
      setTimeRange: setRightTimerange,
    },
  };
}
