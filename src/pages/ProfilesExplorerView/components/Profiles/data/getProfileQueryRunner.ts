import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

export function getProfileQueryRunner(profileMetric: string, labelSelector?: string) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: !labelSelector ? profileMetric : `${profileMetric}-${labelSelector}`,
        queryType: 'metrics',
        profileTypeId: `${profileMetric}`,
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
