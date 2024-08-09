import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useQuery } from '@tanstack/react-query';

import { diffProfileApiClient } from './diffProfileApiClient';

type FetchParams = {
  disabled?: boolean;
};

export function useFetchDiffProfile({ disabled }: FetchParams) {
  const [maxNodes] = useMaxNodesFromUrl();
  const { left, right } = useLeftRightParamsFromUrl();

  // console.log(
  //   '*** useFetchDiffProfile',
  //   left.query,
  //   right.query,
  //   left.timeRange.raw.from.valueOf(),
  //   left.timeRange.raw.to.valueOf(),
  //   right.timeRange.raw.from.valueOf(),
  //   right.timeRange.raw.to.valueOf()
  // );

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> profile does not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled:
      !disabled &&
      Boolean(
        // determining the queries can be asynchronous so we enable only when we have values for both
        left.query &&
          right.query &&
          // determining the correct left/right ranges takes time and can lead to some values being 0
          // in this case, we would send 0 values to the API, which would make the pods crash
          // so we enable only when we have non-zero parameters values
          left.timeRange.raw.from.valueOf() &&
          left.timeRange.raw.to.valueOf() &&
          right.timeRange.raw.from.valueOf() &&
          right.timeRange.raw.to.valueOf()
      ),
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
      maxNodes,
    ],
    queryFn: () => {
      diffProfileApiClient.abort();

      const params = {
        leftQuery: left.query,
        leftTimeRange: left.timeRange,
        rightQuery: right.query,
        rightTimeRange: right.timeRange,
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
