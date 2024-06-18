import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventAddLabelToFiltersPayload {
  item: GridItemData;
}

export class EventAddLabelToFilters extends BusEventWithPayload<EventAddLabelToFiltersPayload> {
  public static type = 'add-label-to-filters';
}
