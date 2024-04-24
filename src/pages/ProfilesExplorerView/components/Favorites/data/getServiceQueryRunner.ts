import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../helpers/constants';

type Params = {
  profileMetricId: string;
  serviceName: string;
};

export function getServiceQueryRunner({ profileMetricId, serviceName }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `${profileMetricId}-${serviceName}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId,
        labelSelector: `{service_name="${serviceName}"}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
