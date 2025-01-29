import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { Metric } from '@shared/infrastructure/metrics/Metric';
import { useFetchMetrics } from '@shared/infrastructure/metrics/useFetchMetrics';

export function useMetricsView() {
  const { metrics, error: fetchError, remove } = useFetchMetrics();

  return {
    data: {
      metrics,
      fetchError,
    },
    actions: {
      async removeMetric(metric: Metric) {
        try {
          await remove(metric);
          displaySuccess([`Metric ${metric.name} deleted!`]);
        } catch (e) {
          displayError(e as Error, [`Failed to delete metric ${metric.name}.`]);
        }
      },
    },
  };
}
