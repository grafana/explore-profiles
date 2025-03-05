import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../pyroscope-data-sources';
import { TimeSeriesQueryRunnerParams } from '../timeseries/TimeSeriesQueryRunnerParams';
import { withPreventInvalidQuery } from '../withPreventInvalidQuery';

type FlameGraphQueryRunnerParams = TimeSeriesQueryRunnerParams & {
  maxNodes?: number;
  spanSelector?: string;
};

export function buildFlameGraphQueryRunner({ filters, maxNodes, spanSelector }: FlameGraphQueryRunnerParams) {
  const completeFilters = filters ? [...filters] : [];
  completeFilters.unshift({ key: 'service_name', operator: '=', value: '$serviceName' });

  const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

  const queryRunner = new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: 'profile',
        queryType: 'profile',
        profileTypeId: '$profileMetricId',
        labelSelector: `{${selector},$filters}`,
        maxNodes,
        ...(spanSelector && { spanSelector: [spanSelector] }),
      },
    ],
  });

  return withPreventInvalidQuery(queryRunner);
}
