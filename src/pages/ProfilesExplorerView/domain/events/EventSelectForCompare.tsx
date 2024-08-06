import { BusEventWithPayload } from '@grafana/data';

import { GridItemDataWithStats } from '../../components/SceneExploreServiceLabels/components/SceneLabelValuesGrid';
import { CompareTarget } from '../../components/SceneExploreServiceLabels/components/SceneLabelValuesStatAndTimeseries/ui/ComparePanel';

export interface EventSelectForComparePayload {
  compareTarget: CompareTarget;
  item: GridItemDataWithStats;
}

export class EventSelectForCompare extends BusEventWithPayload<EventSelectForComparePayload> {
  public static type = 'select-for-compare';
}
