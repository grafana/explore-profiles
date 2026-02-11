import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../../../../infrastructure/pyroscope-data-sources';
import { HierarchyFilter } from '../../../../../infrastructure/timeseries/TimeSeriesQueryRunnerParams';
import { withPreventInvalidQuery } from '../../../../../infrastructure/withPreventInvalidQuery';

export function buildCompareTimeSeriesQueryRunner({
  filterKey,
  hierarchyFilters,
}: {
  filterKey: 'filtersBaseline' | 'filtersComparison';
  hierarchyFilters?: HierarchyFilter[];
}) {
  // Build the label selector from hierarchy filters or fall back to serviceName
  let labelSelector: string;
  if (hierarchyFilters && hierarchyFilters.length > 0) {
    const hierarchySelector = hierarchyFilters.map(({ label, value }) => `${label}="${value}"`).join(',');
    labelSelector = `{${hierarchySelector},$${filterKey}}`;
  } else {
    labelSelector = `{service_name="$serviceName",$${filterKey}}`;
  }

  const queryRunner = new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `$profileMetricId-$serviceName-${filterKey}}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetricId',
        labelSelector,
      },
    ],
  });

  return withPreventInvalidQuery(queryRunner);
}
