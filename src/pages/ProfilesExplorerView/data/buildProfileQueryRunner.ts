import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-source';

type Params = {
  serviceName?: string;
  profileMetricId?: string;
};

export function buildProfileQueryRunner({ serviceName, profileMetricId }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `${serviceName}-${profileMetricId}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: serviceName ? `{service_name="${serviceName}"}` : '{service_name="$serviceName"}',
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
