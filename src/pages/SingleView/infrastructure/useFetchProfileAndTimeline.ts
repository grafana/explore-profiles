import { dateTimeParse, TimeRange } from '@grafana/data';
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
  refetch: () => void;
};

function buildSearchParams(query: string, timeRange: TimeRange, maxNodes: number | null): string {
  // /pyroscope/render requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
  const from = Number(dateTimeParse(timeRange.raw.from).unix()) * 1000;
  const until = Number(dateTimeParse(timeRange.raw.to).unix()) * 1000;

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

  return searchParams.toString();
}

export function useFetchProfileAndTimeline({ query, timeRange, maxNodes, enabled }: FetchParams): FetchResponse {
  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> timeline & profile do not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled,
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    queryKey: [query, timeRange.raw.from.toString(), timeRange.raw.to.toString(), maxNodes],
    queryFn: () => {
      apiClient.abort();

      return apiClient
        .fetch(`/pyroscope/render?${buildSearchParams(query, timeRange, maxNodes)}`)
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
