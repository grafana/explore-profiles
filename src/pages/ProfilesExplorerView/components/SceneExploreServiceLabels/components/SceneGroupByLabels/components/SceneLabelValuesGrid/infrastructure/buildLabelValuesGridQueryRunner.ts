import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../../../../../../../infrastructure/pyroscope-data-sources';
import { HierarchyFilter } from '../../../../../../../infrastructure/timeseries/TimeSeriesQueryRunnerParams';

export function buildLabelValuesGridQueryRunner({
  label,
  hierarchyFilters,
}: {
  label: string;
  hierarchyFilters?: HierarchyFilter[];
}) {
  // Build selector from hierarchy filters or fall back to serviceName
  let selector: string;
  if (hierarchyFilters && hierarchyFilters.length > 0) {
    selector = hierarchyFilters.map(({ label, value }) => `${label}="${value}"`).join(',');
  } else {
    selector = 'service_name="$serviceName"';
  }

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `$profileMetricId-${selector}-${label}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetricId',
        labelSelector: `{${selector}}`,
        groupBy: [label],
      },
    ],
  });
}
