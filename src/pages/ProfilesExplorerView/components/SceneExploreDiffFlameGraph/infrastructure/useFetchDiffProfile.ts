import { TimeRange } from '@grafana/data';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { DataSourceProxyClientBuilder } from '../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { DiffProfileApiClient } from './DiffProfileApiClient';

type FetchParams = {
  dataSourceUid: string;
  serviceName: string;
  baselineTimeRange: TimeRange;
  baselineQuery: string;
  comparisonTimeRange: TimeRange;
  comparisonQuery: string;
};

export function useFetchDiffProfile({
  dataSourceUid,
  serviceName,
  baselineTimeRange,
  baselineQuery,
  comparisonTimeRange,
  comparisonQuery,
}: FetchParams) {
  const [maxNodes] = useMaxNodesFromUrl();

  // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
  const queryKey = [
    'diff-profile',
    baselineQuery,
    baselineTimeRange?.raw.from.toString(),
    baselineTimeRange?.raw.to.toString(),
    comparisonQuery,
    comparisonTimeRange?.raw.from.toString(),
    comparisonTimeRange?.raw.to.toString(),
    maxNodes,
  ];

  useEffect(() => {
    queryClient.setQueryData(queryKey, { profile: null });
  }, [dataSourceUid, serviceName]); // eslint-disable-line react-hooks/exhaustive-deps

  const diffProfileApiClient = DataSourceProxyClientBuilder.build(
    dataSourceUid,
    DiffProfileApiClient
  ) as DiffProfileApiClient;

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> profile does not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled: Boolean(
      baselineQuery &&
        comparisonQuery &&
        // warning: sending zero parameters values to the API would make the pods crash
        // so we enable only when we have non-zero parameters values
        baselineTimeRange?.raw.from.valueOf() &&
        baselineTimeRange?.raw.to.valueOf() &&
        comparisonTimeRange?.raw.from.valueOf() &&
        comparisonTimeRange?.raw.to.valueOf()
    ),
    queryKey, // eslint-disable-line @tanstack/query/exhaustive-deps
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
