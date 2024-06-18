import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventViewServiceFlameGraphPayload {
  item: GridItemData;
}

export class EventViewServiceFlameGraph extends BusEventWithPayload<EventViewServiceFlameGraphPayload> {
  public static type = 'view-service-flame-graph';
}
