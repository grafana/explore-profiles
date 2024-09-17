import { dateTimeParse } from '@grafana/data';
import { useQuery } from '@tanstack/react-query';

import { queryAnalysisApiClient } from '../infrastructure/queryAnalysisApiClient';

export function useQueryAnalysis() {
  // const [query] = useQueryFromUrl();
  // const [timeRange] = useTimeRangeFromUrl();

  // TODO: get the real values when we add the analysis tooltip again
  const query = '';
  const timeRange = {
    raw: {
      from: 'now-5m',
      to: 'now',
    },
    from: dateTimeParse('now-5m'),
    to: dateTimeParse('now'),
  };

  const { isFetching, error, data } = useQuery({
    enabled: Boolean(query),
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
