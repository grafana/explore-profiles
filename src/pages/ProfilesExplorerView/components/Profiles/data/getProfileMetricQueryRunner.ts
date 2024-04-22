import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

type Params = {
  profileMetricId: string;
  labelSelector?: string;
};

export function getProfileMetricQueryRunner({ profileMetricId, labelSelector }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: !labelSelector ? profileMetricId : `${profileMetricId}-${labelSelector}`,
        queryType: 'metrics',
        profileTypeId: `${profileMetricId}`,
        labelSelector: !labelSelector
          ? // interpolated variable
            '{service_name="$serviceName"}'
          : `{service_name="$serviceName",${labelSelector}}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
