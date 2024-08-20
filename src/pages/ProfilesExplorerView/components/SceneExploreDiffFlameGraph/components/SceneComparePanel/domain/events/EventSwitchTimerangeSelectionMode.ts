import { BusEventWithPayload } from '@grafana/data';

import { TimerangeSelectionMode } from '../actions/SwitchTimeRangeSelectionModeAction';

export interface EventSwitchTimerangeSelectionModePayload {
  mode: TimerangeSelectionMode;
}

export class EventSwitchTimerangeSelectionMode extends BusEventWithPayload<EventSwitchTimerangeSelectionModePayload> {
  public static type = 'switch-timerange-selection-mode';
}
