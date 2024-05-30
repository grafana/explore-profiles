import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-source';

type Params = {
  maxNodes?: number;
};

export function buildFlameGraphQueryRunner({ maxNodes }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: 'profile',
        queryType: 'profile',
        profileTypeId: '$profileMetricId',
        labelSelector: `{service_name="$serviceName"}`,
        maxNodes,
      },
    ],
  });
}
