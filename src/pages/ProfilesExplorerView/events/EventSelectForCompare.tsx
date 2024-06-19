import { BusEventWithPayload } from '@grafana/data';

import { CompareAction } from '../actions/CompareAction';
import { GridItemData } from '../types/GridItemData';

export interface EventSelectForComparePayload {
  item: GridItemData;
  isChecked: boolean;
  action: CompareAction;
}

export class EventSelectForCompare extends BusEventWithPayload<EventSelectForComparePayload> {
  public static type = 'select-for-compare';
}
