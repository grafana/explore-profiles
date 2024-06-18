import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventViewLabelValuesDistributionPayload {
  item: GridItemData;
}

export class EventViewLabelValuesDistribution extends BusEventWithPayload<EventViewLabelValuesDistributionPayload> {
  public static type = 'view-label-values-distribution';
}
