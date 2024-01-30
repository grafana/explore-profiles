import { useQuery } from '@tanstack/react-query';
// TODO: migrate these 2 types below
import { Profile } from 'grafana-pyroscope/public/app/legacy/models/profile';
import { Timeline } from 'grafana-pyroscope/public/app/models/timeline';

import { ApiClient } from '../../../shared/infrastructure/http/ApiClient';
import { TimeRange } from '../domain/useUserTimeRange';

const apiClient = new ApiClient();

type FetchSingleViewDataParams = {
  query: string;
  timeRange: TimeRange;
  maxNodes?: number;
  enabled: boolean;
};

type FetchSingleViewDataResponse = {
  isPending: boolean;
  error: Error | null;
  profile?: Profile;
  timeline?: Timeline;
};

export function useFetchProfileAndTimeline({
  query,
  timeRange,
  maxNodes,
  enabled,
}: FetchSingleViewDataParams): FetchSingleViewDataResponse {
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

  const { isPending, error, data } = useQuery({
    enabled,
    queryKey: [query, from, until, maxNodes],
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
