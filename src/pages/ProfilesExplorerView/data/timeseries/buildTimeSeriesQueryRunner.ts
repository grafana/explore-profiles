import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../pyroscope-data-sources';
import { TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

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
        refId: `${profileMetricId || '$profileMetricId'}-${selector}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector},$filters}`,
      },
    ];
  } else {
    queries = [
      {
        refId: `${profileMetricId || '$profileMetricId'}-${selector}-${groupBy.label}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector},$filters}`,
        groupBy: [groupBy.label],
      },
    ];
  }

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries,
  });
}
