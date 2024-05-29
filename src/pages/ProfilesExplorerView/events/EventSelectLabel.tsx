import { BusEventWithPayload } from '@grafana/data';

export interface EventSelectLabelPayload {
  params: Record<string, any>;
}

export class EventSelectLabel extends BusEventWithPayload<EventSelectLabelPayload> {
  public static type = 'select-label';
}
