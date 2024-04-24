import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../helpers/constants';

type Params = {
  serviceName: string;
  labelId: string;
  labelValues: string[];
};

export function getServiceLabelsQueryRunner({ serviceName, labelId, labelValues }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: labelValues.map((value) => ({
      refId: `${serviceName}-${labelId}-${value}`,
      queryType: 'metrics',
      profileTypeId: '$profileMetric', // interpolated variable
      labelSelector: `{service_name="${serviceName}",${labelId}="${value}"}`,
      // maxDataPoints: 1710,
      // intervalMs: 200,
    })),
  });
}
