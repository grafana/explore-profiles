import { BusEventWithPayload, DataFrame } from '@grafana/data';

export interface EventDataReceivedPayload {
  series: DataFrame[];
}

export class EventDataReceived extends BusEventWithPayload<EventDataReceivedPayload> {
  public static type = 'data-received';
}
