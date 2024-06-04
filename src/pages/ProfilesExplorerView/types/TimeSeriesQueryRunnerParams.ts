export type TimeSeriesQueryRunnerParams = {
  serviceName?: string;
  profileMetricId?: string;
  groupBy?: {
    label: string;
    values: string[];
  };
};
