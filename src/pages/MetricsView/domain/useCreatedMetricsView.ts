import { useFetchMetrics } from '@shared/infrastructure/metrics/useFetchMetrics';

export interface Metric {
  name: string;
  profileType: string;
  labels: string[];
  filter: string;
  dataSource: string;
}

export function useCreatedMetricsView() {
  const { metrics, error: fetchError } = useFetchMetrics();

  return {
    data: {
      metrics,
      fetchError,
    },
    actions: {},
  };
}
