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
  completeFilters.unshift(`service_name="${serviceName || '$serviceName'}"`);

  const selector = completeFilters.join(',');

  if (!groupBy) {
    queries = [
      {
        refId: `${profileMetricId || '$profileMetricId'}-${completeFilters}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector}}`,
      },
    ];
  } else {
    queries = groupBy.values.map((labelValue) => {
      return {
        refId: `${profileMetricId || '$profileMetricId'}-${completeFilters}-${groupBy.label}-${labelValue}`,
        queryType: 'metrics',
        profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
        labelSelector: `{${selector},${groupBy.label}="${labelValue}"}`,
        displayNameOverride: labelValue,
      };
    });
  }

  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries,
  });
}
