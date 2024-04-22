import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

type Params = {
  profileMetricId: string;
};

export function getProfileMetricFlameGraphQueryRunner({ profileMetricId }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `profile-${profileMetricId}`,
        queryType: 'profile',
        profileTypeId: profileMetricId,
        labelSelector: `{service_name="$serviceName"}`, // interpolated variable
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
