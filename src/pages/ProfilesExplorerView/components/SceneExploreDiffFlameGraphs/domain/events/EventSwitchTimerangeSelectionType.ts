import { BusEventWithPayload } from '@grafana/data';

import { TimerangeSelectionType } from '../../components/SceneTimerangeSelectionTypeSwitcher';

export interface EventSwitchTimerangeSelectionTypePayload {
  type: TimerangeSelectionType;
}

export class EventSwitchTimerangeSelectionType extends BusEventWithPayload<EventSwitchTimerangeSelectionTypePayload> {
  public static type = 'switch-timerange-selection-type';
}
