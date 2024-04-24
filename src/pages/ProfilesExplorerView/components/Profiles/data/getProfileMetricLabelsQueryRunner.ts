import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../helpers/constants';

type Params = {
  profileMetricId: string;
  labelId: string;
  labelValues: string[];
};

export function getProfileMetricLabelsQueryRunner({ profileMetricId, labelId, labelValues }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: labelValues.map((value) => ({
      refId: `${profileMetricId}-${labelId}-${value}`,
      queryType: 'metrics',
      profileTypeId: profileMetricId,
      labelSelector: `{service_name="$serviceName",${labelId}="${value}"}`, // interpolated variable
      // maxDataPoints: 1710,
      // intervalMs: 200,
    })),
  });
}
