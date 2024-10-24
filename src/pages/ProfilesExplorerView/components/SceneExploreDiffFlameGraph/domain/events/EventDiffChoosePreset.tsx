import { BusEventWithPayload } from '@grafana/data';

export interface EventDiffChoosePresetPayload {}

export class EventDiffChoosePreset extends BusEventWithPayload<EventDiffChoosePresetPayload> {
  public static type = 'diff-choose-preset';
}
