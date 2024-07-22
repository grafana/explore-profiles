import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventAddLabelToFiltersPayload {
  item: GridItemData;
}

export class EventAddLabelToFilters extends BusEventWithPayload<EventAddLabelToFiltersPayload> {
  public static type = 'add-label-to-filters';
}
