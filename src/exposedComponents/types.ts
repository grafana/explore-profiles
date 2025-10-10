import { AdHocVariableFilter, TimeRange } from '@grafana/data';

export interface EmbeddedProfilesExplorationState {
  initialDS?: string;
  initialFilters?: AdHocVariableFilter[];
  initialTimeRange: TimeRange;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  urlSync?: boolean;
  embedded?: boolean;
  returnToPreviousSource?: string;
}
