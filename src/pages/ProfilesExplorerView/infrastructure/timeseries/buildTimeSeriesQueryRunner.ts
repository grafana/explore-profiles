import { AdHocVariableFilter } from '@grafana/data';
import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../pyroscope-data-sources';
import { withPreventInvalidQuery } from '../withPreventInvalidQuery';
import { HierarchyFilter, TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

export type TimeSeriesQuery = {
  refId: string;
  queryType: 'metrics';
  profileTypeId: string;
  labelSelector: string;
  groupBy: string[];
};

function buildFiltersWithHierarchy(
  filters: AdHocVariableFilter[] | undefined,
  hierarchyFilters: HierarchyFilter[] | undefined,
  serviceName: string | undefined
): AdHocVariableFilter[] {
  const completeFilters = filters ? [...filters] : [];

  // Add hierarchy filters if provided, otherwise fall back to serviceName for backwards compatibility
  if (hierarchyFilters && hierarchyFilters.length > 0) {
    hierarchyFilters.forEach(({ label, value }) => {
      completeFilters.unshift({ key: label, operator: '=', value });
    });
  } else {
    completeFilters.unshift({ key: 'service_name', operator: '=', value: serviceName || '$serviceName' });
  }

  return completeFilters;
}

export function buildTimeSeriesQueryRunner(
  { serviceName, profileMetricId, groupBy, filters, hierarchyFilters }: TimeSeriesQueryRunnerParams,
  limit?: number,
  annotations?: boolean,
  includeExemplars?: boolean
) {
  const completeFilters = buildFiltersWithHierarchy(filters, hierarchyFilters, serviceName);
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
        includeExemplars,
      },
    ],
  });

  return withPreventInvalidQuery(queryRunner);
}
