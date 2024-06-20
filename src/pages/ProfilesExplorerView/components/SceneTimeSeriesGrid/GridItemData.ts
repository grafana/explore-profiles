import { TimeSeriesQueryRunnerParams } from '../../data/timeseries/TimeSeriesQueryRunnerParams';

export type GridItemData = {
  index: number; // for coloring purposes only
  value: string;
  label: string;
  queryRunnerParams: TimeSeriesQueryRunnerParams & {
    serviceName: string;
    profileMetricId: string;
    groupBy?: {
      label: string;
      values: string[];
      allValues?: string[];
    };
  };
};
