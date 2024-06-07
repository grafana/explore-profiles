import { SceneQueryRunner } from '@grafana/scenes';

import { TimeSeriesQueryRunnerParams } from '../types/TimeSeriesQueryRunnerParams';
import { PYROSCOPE_DATA_SOURCE } from './pyroscope-data-sources';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildTimeSeriesQueryRunner({
  serviceName,
  profileMetricId,
  groupBy,
  filters,
}: TimeSeriesQueryRunnerParams) {
  let queries;

  const completeFilters = filters ? [...filters] : [];
  completeFilters.unshift({ key: 'service_name', operator: '=', value: serviceName || '$serviceName' });

  const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

  if (!groupBy?.label) {
    queries = [
      {
        refId: `${profileMetricId || '$profileMetricId'}-${JSON.stringify(completeFilters)}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector},$filters}`,
      },
    ];
  } else {
    queries = groupBy.values.map((labelValue) => {
      return {
        refId: `${profileMetricId || '$profileMetricId'}-${JSON.stringify(completeFilters)}-${
          groupBy.label
        }-${labelValue}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector},${groupBy.label}="${labelValue}",$filters}`,
        displayNameOverride: labelValue,
      };
    });
  }

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries,
  });
}
