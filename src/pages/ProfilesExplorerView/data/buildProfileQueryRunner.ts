import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-source';

type Params = {};

export function buildProfileQueryRunner({}: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: 'profile',
        queryType: 'profile',
        profileTypeId: '$profileMetricId',
        labelSelector: `{service_name="$serviceName"}`,
      },
    ],
  });
}
