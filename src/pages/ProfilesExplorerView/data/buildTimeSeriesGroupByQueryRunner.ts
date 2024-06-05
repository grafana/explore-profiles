import { dateTimeParse, TimeRange } from '@grafana/data';
import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';

import { buildPyroscopeQuery } from './buildPyroscopeQuery';
import { buildTimeSeriesQueryRunner } from './buildTimeSeriesQueryRunner';
import { LabelsDataSource } from './LabelsDataSource';

export async function buildTimeSeriesGroupByQueryRunner(
  queryRunnerParams: Record<string, any>,
  timeRange: TimeRange,
  maxLabelValues: number = LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
) {
  let labelValues;

  try {
    const { serviceName, profileMetricId } = queryRunnerParams;
    const { from, to } = timeRange;

    labelValues = await labelsRepository.listLabelValues(
      queryRunnerParams.groupBy.label,
      buildPyroscopeQuery({ serviceName, profileMetricId }),
      dateTimeParse(from.valueOf()).unix() * 1000,
      dateTimeParse(to.valueOf()).unix() * 1000
    );

    labelValues = labelValues.slice(0, maxLabelValues).map(({ value }) => value);
  } catch (error) {
    labelValues = queryRunnerParams.groupBy.values || [];

    console.error('Error while refreshing data!', queryRunnerParams);
    console.error(error);
  }

  return buildTimeSeriesQueryRunner({
    ...queryRunnerParams,
    groupBy: {
      label: queryRunnerParams.groupBy.label,
      values: labelValues,
    },
  });
}
