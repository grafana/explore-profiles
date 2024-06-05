import { SceneQueryRunner } from '@grafana/scenes';

import { TimeSeriesQueryRunnerParams } from '../types/TimeSeriesQueryRunnerParams';
import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-sources';

type FlameGraphQueryRunnerParams = TimeSeriesQueryRunnerParams & {
  maxNodes?: number;
};

export function buildFlameGraphQueryRunner({ filters, maxNodes }: FlameGraphQueryRunnerParams) {
  const completeFilters = filters ? [...filters] : [];
  completeFilters.unshift(['service_name', '$serviceName']);

  const selector = completeFilters.map(([name, value]) => `${name}="${value}"`).join(',');

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: 'profile',
        queryType: 'profile',
        profileTypeId: '$profileMetricId',
        labelSelector: `{${selector}}`,
        maxNodes,
      },
    ],
  });
}
