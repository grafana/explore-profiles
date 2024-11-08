import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../../../../SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventClearLabelFromFiltersPayload {
  item: GridItemData;
}

export class EventClearLabelFromFilters extends BusEventWithPayload<EventClearLabelFromFiltersPayload> {
  public static type = 'clear-label-from-filters';
}
