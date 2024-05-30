import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-sources';

type Params = {
  serviceName?: string;
  profileMetricId?: string;
  groupBy?: {
    label: string;
    values: string[];
  };
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildTimeSeriesQueryRunner({ serviceName, profileMetricId, groupBy }: Params) {
  let queries;

  if (!groupBy) {
    queries = [
      {
        refId: `${serviceName}-${profileMetricId}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: serviceName ? `{service_name="${serviceName}"}` : '{service_name="$serviceName"}',
      },
    ];
  } else {
    queries = groupBy.values.map((labelValue) => {
      return {
        refId: `${serviceName}-${profileMetricId}-${groupBy.label}-${labelValue}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: serviceName
          ? `{service_name="${serviceName}",${groupBy.label}="${labelValue}"}`
          : `{service_name="$serviceName",${groupBy.label}="${labelValue}"}`,
      };
    });
  }

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries,
  });
}
