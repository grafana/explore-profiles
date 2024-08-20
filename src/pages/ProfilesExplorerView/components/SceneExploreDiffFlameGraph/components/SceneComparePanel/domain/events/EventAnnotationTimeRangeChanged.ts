import { BusEventWithPayload, TimeRange } from '@grafana/data';

export interface EventAnnotationTimeRangeChangedPayload {
  timeRange: TimeRange;
}

export class EventAnnotationTimeRangeChanged extends BusEventWithPayload<EventAnnotationTimeRangeChangedPayload> {
  public static type = 'annotation-timerange-changed';
}
