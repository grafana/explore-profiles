import { SceneQueryRunner } from '@grafana/scenes';
import { PYROSCOPE_DATA_SOURCE } from 'src/pages/ProfilesExplorerView/infrastructure/pyroscope-data-sources';

export function buildCompareTimeSeriesQueryRunner({
  filterKey,
}: {
  filterKey: 'filtersBaseline' | 'filtersComparison';
}) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `$profileMetricId-$serviceName-${filterKey}}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetricId',
        labelSelector: `{service_name="$serviceName",$${filterKey}}`,
      },
    ],
  });
}
