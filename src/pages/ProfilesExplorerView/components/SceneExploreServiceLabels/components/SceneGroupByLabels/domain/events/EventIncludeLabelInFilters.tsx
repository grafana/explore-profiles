import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../../../../SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventIncludeLabelInFiltersPayload {
  item: GridItemData;
}

export class EventIncludeLabelInFilters extends BusEventWithPayload<EventIncludeLabelInFiltersPayload> {
  public static type = 'include-label-in-filters';
}

export interface EventExcludeLabelFromFiltersPayload {
  item: GridItemData;
}
