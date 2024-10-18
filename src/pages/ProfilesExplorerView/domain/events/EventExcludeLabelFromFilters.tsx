import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventIncludeLabelInFiltersPayload {
  item: GridItemData;
}

export class EventIncludeLabelInFilters extends BusEventWithPayload<EventIncludeLabelInFiltersPayload> {
  public static type = 'include-label-in-filters';
}

export interface EventExcludeLabelFromFiltersPayload {
  item: GridItemData;
}

export class EventExcludeLabelFromFilters extends BusEventWithPayload<EventExcludeLabelFromFiltersPayload> {
  public static type = 'exclude-label-from-filters';
}
