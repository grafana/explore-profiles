import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { CompareTarget } from '../../components/SceneLabelValuesGrid/domain/types';

export interface EventSelectForComparePayload {
  compareTarget: CompareTarget;
  item: GridItemData;
}

export class EventSelectForCompare extends BusEventWithPayload<EventSelectForComparePayload> {
  public static type = 'select-for-compare';
}
