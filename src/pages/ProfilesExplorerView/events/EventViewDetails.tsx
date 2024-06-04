import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventViewDetailsPayload {
  item: GridItemData;
}

export class EventViewDetails extends BusEventWithPayload<EventViewDetailsPayload> {
  public static type = 'view-details';
}
