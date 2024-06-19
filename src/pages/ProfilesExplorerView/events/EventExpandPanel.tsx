import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventExpandPanelPayload {
  item: GridItemData;
}

export class EventExpandPanel extends BusEventWithPayload<EventExpandPanelPayload> {
  public static type = 'expand-panel';
}
