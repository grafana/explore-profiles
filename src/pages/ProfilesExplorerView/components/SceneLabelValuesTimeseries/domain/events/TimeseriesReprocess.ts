import { BusEventWithPayload } from '@grafana/data';

export interface TimeseriesReprocessPayload {}

export class TimeseriesReprocess extends BusEventWithPayload<TimeseriesReprocessPayload> {
  public static type = 'reprocess-timeseries';
}
