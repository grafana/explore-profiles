import { TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { Timeline } from '@shared/types/Timeline';
import { useQuery } from '@tanstack/react-query';

const apiClient = new ApiClient();

type FetchParams = {
  query: string;
  timeRange: TimeRange;
  maxNodes: number | null;
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
  // /pyroscope/render requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
  const from = Number(timeRange.from.unix()) * 1000;
  const until = Number(timeRange.to.unix()) * 1000;

  const searchParams = new URLSearchParams({
    query,
    from: String(from),
    until: String(until),
    aggregation: 'sum',
    format: 'json',
  });

  if (Number(maxNodes) > 0) {
    searchParams.set('max-nodes', String(maxNodes));
  }

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> timeline & profile do not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled,
    queryKey: [query, from, until, maxNodes],
    queryFn: () => {
      apiClient.abort();

      return apiClient
        .fetch(`/pyroscope/render?${searchParams.toString()}`)
        .then((response) => response.json())
        .then((json) => ({
          profile: {
            version: json.version,
            flamebearer: json.flamebearer,
            metadata: json.metadata,
          },
          timeline: json.timeline,
        }));
    },
  });

  return {
    isFetching,
    error: apiClient.isAbortError(error) ? null : error,
    ...data,
    refetch,
  };
}
