import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventViewServiceLabelsPayload {
  item: GridItemData;
}

export class EventViewServiceLabels extends BusEventWithPayload<EventViewServiceLabelsPayload> {
  public static type = 'view-service-labels';
}
