import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

export function getProfileMetricLabelsQueryRunner(profileMetricId: string, labelId: string, labelValues: string[]) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: labelValues.map((value) => ({
      refId: value,
      queryType: 'metrics',
      profileTypeId: profileMetricId,
      labelSelector: `{service_name="$serviceName",${labelId}="${value}"}`, // interpolated variable
      // maxDataPoints: 1710,
      // intervalMs: 200,
    })),
  });
}
