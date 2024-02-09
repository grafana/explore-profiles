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
};

export function useFetchServices({ timeRange, enabled }: FetchParams): FetchResponse {
  const { isFetching, error, data } = useQuery({
    enabled,
    // for UX: keep previous data while fetching -> the dropdowns do not re-render (causing layout shifts)
    placeholderData: (previousData) => previousData,
    // to have a stable key, we use the raw values in case relative time ranges are passed (e.g. "now-5m")
    queryKey: [timeRange.raw.from, timeRange.raw.to],
    queryFn: () => {
      servicesApiClient.abort();
      return servicesApiClient.list({ timeRange });
    },
  });

  return {
    isFetching,
    error: servicesApiClient.isAbortError(error) ? null : error,
    services: data || new Map(),
  };
}
