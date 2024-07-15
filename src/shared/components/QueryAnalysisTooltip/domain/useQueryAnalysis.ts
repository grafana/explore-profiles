import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useQuery } from '@tanstack/react-query';

import { queryAnalysisApiClient } from '../infrastructure/queryAnalysisApiClient';

export function useQueryAnalysis() {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();

  const { isFetching, error, data } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['query-analysis', query, Math.floor(timeRange.from.unix() / 60), Math.floor(timeRange.to.unix() / 60)],
    queryFn: () => queryAnalysisApiClient.get(timeRange, query),
  });

  const queriedSeriesInfoText =
    data?.queryImpact.totalQueriedSeries && data?.queryImpact.totalQueriedSeries > 1
      ? `${data.queryImpact.totalQueriedSeries} series`
      : '';

  return {
    isFetching,
    error,
    queryAnalysis: data,
    queriedSeriesInfoText,
  };
}
