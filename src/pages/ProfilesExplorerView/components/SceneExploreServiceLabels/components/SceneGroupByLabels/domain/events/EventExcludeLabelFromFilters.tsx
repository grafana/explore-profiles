import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../../../../SceneByVariableRepeaterGrid/types/GridItemData';

export interface EventExcludeLabelFromFiltersPayload {
  item: GridItemData;
}

export class EventExcludeLabelFromFilters extends BusEventWithPayload<EventExcludeLabelFromFiltersPayload> {
  public static type = 'exclude-label-from-filters';
}
