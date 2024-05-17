import { SceneQueryRunner } from '@grafana/scenes';

const PYROSCOPE_DATA_SOURCE = Object.freeze({
  type: 'grafana-pyroscope-datasource',
  uid: '$dataSource', // interpolated variable
});

type Params = {
  serviceName: string;
  labelSelector?: string;
};

export function getServiceQueryRunner({ serviceName, labelSelector }: Params) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: !labelSelector ? serviceName : `${serviceName}-${labelSelector}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetricId', // interpolated variable
        labelSelector: !labelSelector
          ? `{service_name="${serviceName}"}`
          : `{service_name="${serviceName}",${labelSelector}}`,
        // maxDataPoints: 1710,
        // intervalMs: 200,
      },
    ],
  });
}
