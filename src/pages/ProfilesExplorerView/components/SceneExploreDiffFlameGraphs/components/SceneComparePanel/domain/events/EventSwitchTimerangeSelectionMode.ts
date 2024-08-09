import { BusEventWithPayload } from '@grafana/data';

import { TimerangeSelectionMode } from '../actions/SwitchTimeRangeSelectionModeAction';

export interface EventSwitchTimerangeSelectionTypePayload {
  mode: TimerangeSelectionMode;
}

export class EventSwitchTimerangeSelectionMode extends BusEventWithPayload<EventSwitchTimerangeSelectionTypePayload> {
  public static type = 'switch-timerange-selection-mode';
}
