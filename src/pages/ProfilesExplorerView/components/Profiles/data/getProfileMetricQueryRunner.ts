import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

export function getProfileMetricQueryRunner(profileMetricId: string, labelSelector?: string) {
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
