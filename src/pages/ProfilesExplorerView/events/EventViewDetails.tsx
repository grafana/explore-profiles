import { BusEventWithPayload } from '@grafana/data';

export interface EventViewDetailsPayload {
  params: Record<string, any>;
}

export class EventViewDetails extends BusEventWithPayload<EventViewDetailsPayload> {
  public static type = 'view-details';
}
