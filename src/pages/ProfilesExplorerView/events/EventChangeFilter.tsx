import { BusEventWithPayload } from '@grafana/data';

export interface EventChangeFilterPayload {
  searchText: string;
}

export class EventChangeFilter extends BusEventWithPayload<EventChangeFilterPayload> {
  public static type = 'change-filter';
}
