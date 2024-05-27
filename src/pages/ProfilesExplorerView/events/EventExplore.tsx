import { BusEventWithPayload } from '@grafana/data';

export interface EventExplorePayload {
  params: Record<string, any>;
}

export class EventExplore extends BusEventWithPayload<EventExplorePayload> {
  public static type = 'explore';
}
