import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useQuery } from '@tanstack/react-query';

import { diffProfileApiClient } from './diffProfileApiClient';

type FetchParams = {
  disabled?: boolean;
};

export function useFetchDiffProfile({ disabled }: FetchParams) {
  const { left, right } = useLeftRightParamsFromUrl();

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> profile does not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    // determining the queries can be asynchronous so we enable only when we have values for both
    enabled: !disabled && Boolean(left.query && right.query),
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'diff-profile',
      left.query,
      left.timeRange.raw.from.toString(),
      left.timeRange.raw.to.toString(),
      right.query,
      right.timeRange.raw.from.toString(),
      right.timeRange.raw.to.toString(),
    ],
    queryFn: () => {
      diffProfileApiClient.abort();

      const params = {
        leftQuery: left.query,
        leftTimeRange: left.timeRange,
        rightQuery: right.query,
        rightTimeRange: right.timeRange,
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
