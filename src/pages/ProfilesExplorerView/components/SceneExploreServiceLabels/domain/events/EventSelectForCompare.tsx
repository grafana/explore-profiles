import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { CompareTarget } from '../../components/SceneGroupByLabels/components/SceneLabelValuesGrid/components/SceneComparePanel/ui/ComparePanel';

export interface EventSelectForComparePayload {
  compareTarget: CompareTarget;
  item: GridItemData;
}

export class EventSelectForCompare extends BusEventWithPayload<EventSelectForComparePayload> {
  public static type = 'select-for-compare';
}
