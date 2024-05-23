import { BusEventWithPayload } from '@grafana/data';

export interface EventChangeLayoutPayload {
  layout: string;
}

export class EventChangeLayout extends BusEventWithPayload<EventChangeLayoutPayload> {
  public static type = 'change-layout';
}
