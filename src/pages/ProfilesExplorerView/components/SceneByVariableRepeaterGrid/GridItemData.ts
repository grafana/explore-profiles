import { AdHocVariableFilter } from '@grafana/data';

export type GridItemData = {
  index: number; // for coloring purposes only
  value: string;
  label: string;
  queryRunnerParams: {
    serviceName?: string;
    profileMetricId?: string;
    groupBy?: {
      label: string;
      values: string[];
      allValues: string[];
    };
    filters?: AdHocVariableFilter[];
  };
};