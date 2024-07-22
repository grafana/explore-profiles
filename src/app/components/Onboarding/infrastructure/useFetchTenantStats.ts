import { useQuery } from '@tanstack/react-query';

import { Stats, statsApiClient } from './statsApiClient';

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  stats?: Stats;
  refetch: () => void;
};

export function useFetchTenantStats({ enabled }: { enabled: boolean }): FetchResponse {
  const { isFetching, error, data, refetch } = useQuery({
    enabled,
    placeholderData: () => ({ hasIngestedData: true, oldestProfileTime: 0, newestProfileTime: 0 }),
    queryKey: ['tenant-stats'],
    queryFn: () => {
      statsApiClient.abort();

      return statsApiClient.get();
    },
  });

  return {
    isFetching,
    error: statsApiClient.isAbortError(error) ? null : error,
    stats: data,
    refetch,
  };
}
