import { BusEventWithPayload } from '@grafana/data';

export interface EventDiffAutoSelectPayload {
  wholeRange: boolean;
}

export class EventDiffAutoSelect extends BusEventWithPayload<EventDiffAutoSelectPayload> {
  public static type = 'diff-auto-select';
}
