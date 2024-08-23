import { BusEventWithPayload, DataFrame } from '@grafana/data';

export interface EventTimeseriesDataReceivedPayload {
  series?: DataFrame[];
}

export class EventTimeseriesDataReceived extends BusEventWithPayload<EventTimeseriesDataReceivedPayload> {
  public static type = 'timeseries-data-received';
}
