import { TimeRange } from '@grafana/data';
import { useQuery } from '@tanstack/react-query';

import { Services, servicesApiClient } from './servicesApiClient';

type FetchParams = {
  timeRange: TimeRange;
  enabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  services: Services;
  refetch: () => void;
};

export function useFetchServices({ timeRange, enabled }: FetchParams): FetchResponse {
  const { isFetching, error, data, refetch } = useQuery({
    enabled,
    // for UX: keep previous data while fetching -> the dropdowns do not re-render (causing layout shifts)
    placeholderData: (previousData) => previousData,
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    queryKey: [timeRange.raw.from.toString(), timeRange.raw.to.toString()],
    queryFn: () => {
      servicesApiClient.abort();

      return servicesApiClient.list({ timeRange });
    },
  });

  return {
    isFetching,
    error: servicesApiClient.isAbortError(error) ? null : error,
    services: data || new Map(),
    refetch,
  };
}
