import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

type Params = {
  profileMetricId: string;
  serviceName: string;
  labelId: string;
  labelValues: string[];
};

export function getLabelsQueryRunner({ profileMetricId, serviceName, labelId, labelValues }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: labelValues.map((value) => ({
      refId: `${profileMetricId}-${serviceName}-${labelId}-${value}`,
      queryType: 'metrics',
      profileTypeId: profileMetricId,
      labelSelector: `{service_name="${serviceName}",${labelId}="${value}"}`,
      // maxDataPoints: 1710,
      // intervalMs: 200,
    })),
  });
}
