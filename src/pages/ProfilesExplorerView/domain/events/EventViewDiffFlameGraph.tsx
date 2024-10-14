import { BusEventWithPayload } from '@grafana/data';

interface EventViewDiffFlameGraphPayload {}

export class EventViewDiffFlameGraph extends BusEventWithPayload<EventViewDiffFlameGraphPayload> {
  public static type = 'view-diff-flame-graph';
}
