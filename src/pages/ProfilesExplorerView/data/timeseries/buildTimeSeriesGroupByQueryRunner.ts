import { dateTimeParse, TimeRange } from '@grafana/data';
import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';

import { buildPyroscopeQuery } from '../helpers/buildPyroscopeQuery';
import { LabelsDataSource } from '../labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from './buildTimeSeriesQueryRunner';
import { TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

type TimeSeriesQueryGroupByRunnerParams = {
  queryRunnerParams: TimeSeriesQueryRunnerParams;
  timeRange: TimeRange;
  maxLabelValues?: number;
};

export async function buildTimeSeriesGroupByQueryRunner({
  queryRunnerParams,
  timeRange,
  maxLabelValues,
}: TimeSeriesQueryGroupByRunnerParams) {
  const serviceName = queryRunnerParams.serviceName as string;
  const profileMetricId = queryRunnerParams.profileMetricId as string;
  const groupBy = queryRunnerParams.groupBy;

  let labelValues;

  try {
    const { from, to } = timeRange;

    labelValues = await labelsRepository.listLabelValues(
      groupBy!.label,
      buildPyroscopeQuery({ serviceName, profileMetricId }),
      dateTimeParse(from.valueOf()).unix() * 1000,
      dateTimeParse(to.valueOf()).unix() * 1000
    );

    labelValues = labelValues
      .slice(0, maxLabelValues || LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES)
      .map(({ value }) => value);
  } catch (error) {
    labelValues = groupBy!.values || [];

    console.error('Error while refreshing data!', queryRunnerParams);
    console.error(error);
  }

  return buildTimeSeriesQueryRunner({
    ...queryRunnerParams,
    groupBy: {
      label: groupBy!.label,
      values: labelValues,
    },
  });
}
