import { useQuery } from '@tanstack/react-query';
// TODO: migrate these 2 types below
import { Profile } from 'grafana-pyroscope/public/app/legacy/models/profile';
import { Timeline } from 'grafana-pyroscope/public/app/models/timeline';

import { ApiClient } from '../../../shared/infrastructure/http/ApiClient';
import { TimeRange } from '../domain/useUserTimeRange';

const apiClient = new ApiClient();

type FetchSingleViewDataResponse = {
  isPending: boolean;
  error: Error | null;
  profile?: Profile;
  timeline?: Timeline;
};

export function useFetchProfileAndTimeline(query: string, timeRange: TimeRange): FetchSingleViewDataResponse {
  const { from, until } = timeRange;

  const searchParams = new URLSearchParams({
    query,
    from,
    until,
    aggregation: 'sum',
    format: 'json',
  });

  const { isPending, error, data } = useQuery({
    queryKey: [query, from, until],
    queryFn: () => apiClient.fetch(`/pyroscope/render?${searchParams.toString()}`).then((response) => response.json()),
  });

  return {
    isPending,
    error,
    profile: data
      ? {
          version: data.version,
          flamebearer: data.flamebearer,
          metadata: data.metadata,
        }
      : undefined,
    timeline: data?.timeline,
  };
}
