import { BusEventWithPayload } from '@grafana/data';

import { CompareTarget } from '../../components/SceneGroupByLabels/components/SceneLabelValuesGrid/components/SceneComparePanel/ui/ComparePanel';
import { GridItemDataWithStats } from '../../components/SceneGroupByLabels/components/SceneLabelValuesGrid/SceneLabelValuesGrid';

export interface EventSelectForComparePayload {
  compareTarget: CompareTarget;
  item: GridItemDataWithStats;
}

export class EventSelectForCompare extends BusEventWithPayload<EventSelectForComparePayload> {
  public static type = 'select-for-compare';
}
