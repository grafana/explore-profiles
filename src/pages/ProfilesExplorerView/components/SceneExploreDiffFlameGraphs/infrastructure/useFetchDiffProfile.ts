import { TimeRange } from '@grafana/data';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useQuery } from '@tanstack/react-query';

import { diffProfileApiClient } from './diffProfileApiClient';

type FetchParams = {
  baselineTimeRange: TimeRange;
  baselineQuery: string;
  comparisonTimeRange: TimeRange;
  comparisonQuery: string;
};

export function useFetchDiffProfile({
  baselineTimeRange,
  baselineQuery,
  comparisonTimeRange,
  comparisonQuery,
}: FetchParams) {
  const [maxNodes] = useMaxNodesFromUrl();

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> profile does not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled: Boolean(
      baselineQuery &&
        comparisonQuery &&
        // determining the correct left/right ranges takes time and can lead to some values being 0
        // in this case, we would send 0 values to the API, which would make the pods crash
        // so we enable only when we have non-zero parameters values
        baselineTimeRange?.raw.from.valueOf() &&
        baselineTimeRange?.raw.to.valueOf() &&
        comparisonTimeRange?.raw.from.valueOf() &&
        comparisonTimeRange?.raw.to.valueOf()
    ),
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'diff-profile',
      baselineQuery,
      baselineTimeRange?.raw.from.toString(),
      baselineTimeRange?.raw.to.toString(),
      comparisonQuery,
      comparisonTimeRange?.raw.from.toString(),
      comparisonTimeRange?.raw.to.toString(),
      maxNodes,
    ],
    queryFn: () => {
      diffProfileApiClient.abort();

      const params = {
        leftQuery: baselineQuery,
        leftTimeRange: baselineTimeRange!,
        rightQuery: comparisonQuery,
        rightTimeRange: comparisonTimeRange!,
        maxNodes,
      };

      return diffProfileApiClient.get(params).then((json) => ({
        profile: {
          version: json.version,
          flamebearer: json.flamebearer,
          metadata: json.metadata,
        },
      }));
    },
  });

  return {
    isFetching,
    error: diffProfileApiClient.isAbortError(error) ? null : error,
    ...data,
    refetch,
  };
}
