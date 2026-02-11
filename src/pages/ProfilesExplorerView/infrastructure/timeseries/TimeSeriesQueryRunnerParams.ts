import { AdHocVariableFilter } from '@grafana/data';

export type HierarchyFilter = {
  label: string;
  value: string;
};

export type TimeSeriesQueryRunnerParams = {
  serviceName?: string;
  profileMetricId?: string;
  groupBy?: {
    label: string;
  };
  filters?: AdHocVariableFilter[];
  hierarchyFilters?: HierarchyFilter[];
};
