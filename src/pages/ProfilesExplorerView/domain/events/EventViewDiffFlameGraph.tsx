import { AdHocVariableFilter, BusEventWithPayload } from '@grafana/data';

interface EventViewDiffFlameGraphPayload {
  useAncestorTimeRange: boolean;
  clearDiffRange: boolean;
  baselineFilters: AdHocVariableFilter[];
  comparisonFilters: AdHocVariableFilter[];
}

export class EventViewDiffFlameGraph extends BusEventWithPayload<EventViewDiffFlameGraphPayload> {
  public static type = 'view-diff-flame-graph';
}
