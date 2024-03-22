import { TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { timelineAndProfileApiClient } from '@shared/infrastructure/timelineAndProfileApiClient';
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

export function useFetchProfileAndTimeline({ query, timeRange, maxNodes, enabled }: FetchParams): FetchResponse {
  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> timeline & profile do not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    enabled,
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [query, timeRange.raw.from.toString(), timeRange.raw.to.toString(), maxNodes],
    queryFn: () => {
      timelineAndProfileApiClient.abort();

      return timelineAndProfileApiClient.get(query, timeRange, maxNodes).then((json) => ({
        timeline: json.timeline,
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
    error: apiClient.isAbortError(error) ? null : error,
    ...data,
    refetch,
  };
}
