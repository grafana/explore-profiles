import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventAddToFiltersPayload {
  item: GridItemData;
}

export class EventAddToFilters extends BusEventWithPayload<EventAddToFiltersPayload> {
  public static type = 'add-to-filters';
}
