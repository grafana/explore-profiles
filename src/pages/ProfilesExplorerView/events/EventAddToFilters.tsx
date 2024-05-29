import { BusEventWithPayload } from '@grafana/data';

export interface EventAddToFiltersPayload {
  params: Record<string, any>;
}

export class EventAddToFilters extends BusEventWithPayload<EventAddToFiltersPayload> {
  public static type = 'add-to-filters';
}
