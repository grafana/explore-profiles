import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-source';

type Params = {
  profileMetricId: string;
  serviceName: string;
};

export function getServiceAndProfileMetricQueryRunner({ serviceName, profileMetricId }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `${serviceName}-${profileMetricId}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId,
        labelSelector: `{service_name="${serviceName}"}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
