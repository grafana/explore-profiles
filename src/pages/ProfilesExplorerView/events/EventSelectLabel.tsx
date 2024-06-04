import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventSelectLabelPayload {
  item: GridItemData;
}

export class EventSelectLabel extends BusEventWithPayload<EventSelectLabelPayload> {
  public static type = 'select-label';
}
