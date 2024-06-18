import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventViewServiceProfilesPayload {
  item: GridItemData;
}

export class EventViewServiceProfiles extends BusEventWithPayload<EventViewServiceProfilesPayload> {
  public static type = 'view-service-profiles';
}
