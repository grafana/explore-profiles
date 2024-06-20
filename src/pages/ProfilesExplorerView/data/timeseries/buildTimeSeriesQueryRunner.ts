import { SceneQueryRunner } from '@grafana/scenes';

import { PYROSCOPE_DATA_SOURCE } from '../pyroscope-data-sources';
import { TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildTimeSeriesQueryRunner(
  { serviceName, profileMetricId, groupBy, filters }: TimeSeriesQueryRunnerParams,
  useSingleGroupByQuery = false
) {
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
    queries = useSingleGroupByQuery
      ? [
          {
            refId: `${profileMetricId || '$profileMetricId'}-${JSON.stringify(completeFilters)}-${groupBy.label}`,
            queryType: 'metrics',
            profileTypeId: profileMetricId ? profileMetricId : '$profileMetricId',
            labelSelector: `{service_name="${serviceName}",$filters}`,
            groupBy: [groupBy.label],
          },
        ]
      : groupBy.values.map((labelValue) => {
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
