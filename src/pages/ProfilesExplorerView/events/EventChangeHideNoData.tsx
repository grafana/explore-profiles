import { BusEventWithPayload } from '@grafana/data';

export interface EventChangeHideNoDataPayload {
  hideNoData: boolean;
}

export class EventChangeHideNoData extends BusEventWithPayload<EventChangeHideNoDataPayload> {
  public static type = 'change-hide-no-data';
}
