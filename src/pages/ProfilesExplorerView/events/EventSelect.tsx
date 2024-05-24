import { BusEventWithPayload } from '@grafana/data';

export interface EventSelectPayload {
  params: Record<string, any>;
}

export class EventSelect extends BusEventWithPayload<EventSelectPayload> {
  public static type = 'select-item';
}
