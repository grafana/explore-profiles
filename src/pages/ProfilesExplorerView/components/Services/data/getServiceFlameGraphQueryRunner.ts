import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../helpers/constants';

type Params = {
  serviceName: string;
};

export function getServiceFlameGraphQueryRunner({ serviceName }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `profile-${serviceName}`,
        queryType: 'profile',
        profileTypeId: '$profileMetric', // interpolated variable
        labelSelector: `{service_name="${serviceName}"}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
