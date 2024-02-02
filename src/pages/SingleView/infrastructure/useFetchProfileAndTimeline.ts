import { useQuery } from '@tanstack/react-query';

import { ApiClient } from '../../../shared/infrastructure/http/ApiClient';
import { FlamebearerProfile } from '../../../shared/types/FlamebearerProfile';
import { Timeline } from '../../../shared/types/Timeline';
import { TimeRange } from '../../../shared/types/TimeRange';

const apiClient = new ApiClient();

type FetchParams = {
  query: string;
  timeRange: TimeRange;
  maxNodes?: number;
  enabled: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  profile?: FlamebearerProfile;
  timeline?: Timeline;
  refetch: () => {};
};

export function useFetchProfileAndTimeline({ query, timeRange, maxNodes, enabled }: FetchParams): FetchResponse {
  const { from, until } = timeRange;

  const searchParams = new URLSearchParams({
    query,
    from,
    until,
    aggregation: 'sum',
    format: 'json',
  });

  if (Number(maxNodes) > 0) {
    searchParams.set('max-nodes', String(maxNodes));
  }

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> timeline & profile do not re-render with empty panels
    placeholderData: (previousData) => previousData,
    enabled,
    queryKey: [query, from, until, maxNodes],
    queryFn: () =>
      apiClient
        .fetch(`/pyroscope/render?${searchParams.toString()}`)
        .then((response) => response.json())
        .then((json) => ({
          profile: {
            version: json.version,
            flamebearer: json.flamebearer,
            metadata: json.metadata,
          },
          timeline: json.timeline,
        })),
  });

  return {
    isFetching,
    error: apiClient.isAbortError(error) ? null : error,
    ...data,
    refetch,
  };
}
