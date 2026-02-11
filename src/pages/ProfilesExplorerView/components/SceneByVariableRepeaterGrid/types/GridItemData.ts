import { AdHocVariableFilter } from '@grafana/data';

import { HierarchyFilter } from '../../../infrastructure/timeseries/TimeSeriesQueryRunnerParams';
import { PanelType } from '../components/ScenePanelTypeSwitcher';

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
    };
    filters?: AdHocVariableFilter[];
    hierarchyFilters?: HierarchyFilter[];
  };
  panelType: PanelType;
};
