import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../pyroscope-data-sources';
import { withPreventInvalidQuery } from '../withPreventInvalidQuery';
import { TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

export type TimeSeriesQuery = {
  refId: string;
  queryType: 'metrics';
  profileTypeId: string;
  labelSelector: string;
  groupBy: string[];
};

export function buildTimeSeriesQueryRunner(
  { serviceName, profileMetricId, groupBy, filters }: TimeSeriesQueryRunnerParams,
  limit?: number,
  annotations?: boolean
) {
  const completeFilters = filters ? [...filters] : [];
  completeFilters.unshift({ key: 'service_name', operator: '=', value: serviceName || '$serviceName' });

  const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

  const queryRunner = new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `${profileMetricId || '$profileMetricId'}-${selector}-${groupBy?.label || 'no-group-by'}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId || '$profileMetricId',
        labelSelector: `{${selector},$filters}`,
        groupBy: groupBy?.label ? [groupBy.label] : [],
        limit,
        annotations,
      },
    ],
  });

  return withPreventInvalidQuery(queryRunner);
}
