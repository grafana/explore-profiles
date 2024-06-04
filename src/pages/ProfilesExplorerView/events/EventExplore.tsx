import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventExplorePayload {
  item: GridItemData;
}

export class EventExplore extends BusEventWithPayload<EventExplorePayload> {
  public static type = 'explore';
}
