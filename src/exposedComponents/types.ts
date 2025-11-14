import { AdHocVariableFilter, TimeRange } from '@grafana/data';

export interface EmbeddedProfilesExplorationState {
  initialDS?: string;
  initialFilters?: AdHocVariableFilter[];
  initialTimeRange: TimeRange;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  returnToPreviousSource?: string;
}
