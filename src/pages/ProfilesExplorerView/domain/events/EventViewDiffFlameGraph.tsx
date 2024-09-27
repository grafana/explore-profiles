import { BusEventWithPayload } from '@grafana/data';

export interface EventViewDiffFlameGraphPayload {}

export class EventViewDiffFlameGraph extends BusEventWithPayload<EventViewDiffFlameGraphPayload> {
  public static type = 'view-diff-flame-graph';
}
