import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../constants';

export function getServiceQueryRunner(serviceName: string, labelSelector?: string) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: !labelSelector ? serviceName : `${serviceName}-${labelSelector}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetric', // interpolated variable
        labelSelector: !labelSelector
          ? `{service_name="${serviceName}"}`
          : `{service_name="${serviceName}",${labelSelector}}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
