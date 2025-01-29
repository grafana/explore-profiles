import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { Metric } from '@shared/infrastructure/metrics/Metric';
import { useFetchMetrics } from '@shared/infrastructure/metrics/useFetchMetrics';

export function useCreateMetric() {
  const { metrics, error: fetchError, mutate } = useFetchMetrics();

  return {
    data: {
      metrics,
      fetchError,
    },
    actions: {
      async save(metric: Metric) {
        try {
          await mutate(metric);
          displaySuccess([`Metric ${metric.name} created successfully!`]);
        } catch (e) {
          displayError(e as Error, ['Failed to save metric']);
        }
      },
    },
  };
}
