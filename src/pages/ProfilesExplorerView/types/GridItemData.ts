import { TimeSeriesQueryRunnerParams } from './TimeSeriesQueryRunnerParams';

export type GridItemData = {
  index: number; // for coloring purposes only
  value: string;
  label: string;
  queryRunnerParams: TimeSeriesQueryRunnerParams & {
    serviceName: string;
    profileMetricId: string;
  };
};
