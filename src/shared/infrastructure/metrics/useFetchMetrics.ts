import { metricsApiClient } from '@shared/infrastructure/metrics/metricsApiClient';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Metric } from './Metric';

type FetchParams = {
  enabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  metrics?: Metric[];
  mutate: (newMetric: Metric) => Promise<void>;
  remove: (metric: Metric) => Promise<void>;
};

export function useFetchMetrics({ enabled }: FetchParams = {}): FetchResponse {
  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: ['metrics'],
    queryFn: () => metricsApiClient.get(),
  });

  const { mutateAsync: mutate } = useMutation({
    mutationFn: (metric: Metric) => metricsApiClient.create(metric),
    networkMode: 'always',
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: (metric: Metric) => metricsApiClient.remove(metric),
    networkMode: 'always',
  });

  return {
    isFetching,
    error: metricsApiClient.isAbortError(error) ? null : error,
    metrics: data,
    mutate,
    remove,
  };
}
