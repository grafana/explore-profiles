import { TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { Timeline } from '@shared/types/Timeline';
import { useQuery } from '@tanstack/react-query';

import { TimelineAndProfileApiClient, timelineAndProfileApiClient } from './timelineAndProfileApiClient';

const apiClient = new ApiClient();

export type FetchTimelineAndProfileTarget =
  | 'main'
  | 'left-timeline'
  | 'left-profile'
  | 'right-timeline'
  | 'right-profile';

type FetchParams = {
  target: FetchTimelineAndProfileTarget;
  query: string;
  timeRange: TimeRange;
  maxNodes: number | null;
  disabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  profile?: FlamebearerProfile;
  timeline?: Timeline;
  refetch: () => void;
};

// Each target has its own TimelineAndProfileApiClient to ensure we abort the correct request
// TODO: find a better solution
const TIMELINE_AND_PROFILE_API_CLIENTS = new Map<FetchTimelineAndProfileTarget, TimelineAndProfileApiClient>([
  // ugly: we have to reuse this client, which is used to fetch the main timeline, so that useFetchFunctionsDetails() can work properly
  // TODO: find a better solution
  ['main', timelineAndProfileApiClient],
  ['left-timeline', new TimelineAndProfileApiClient()],
  ['left-profile', new TimelineAndProfileApiClient()],
  ['right-timeline', new TimelineAndProfileApiClient()],
  ['right-profile', new TimelineAndProfileApiClient()],
]);

export function useFetchTimelineAndProfile({
  target,
  query,
  timeRange,
  maxNodes,
  disabled,
}: FetchParams): FetchResponse {
  const timelineAndProfileApiClient = TIMELINE_AND_PROFILE_API_CLIENTS.get(target) as TimelineAndProfileApiClient;

  const { isFetching, error, data, refetch } = useQuery({
    // for UX: keep previous data while fetching -> timeline & profile do not re-render with empty panels when refreshing
    placeholderData: (previousData) => previousData,
    // determining query and maxNodes can be asynchronous so we enable the main query only when we have values for both
    enabled: !disabled && Boolean(query && maxNodes),
    // we use "raw" to cache relative time ranges between renders, so that only refetch() will trigger a new query
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [target, query, timeRange.raw.from.toString(), timeRange.raw.to.toString(), maxNodes],
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
