import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventViewLabelsPieChartPayload {
  item: GridItemData;
}

export class EventViewLabelsPieChart extends BusEventWithPayload<EventViewLabelsPieChartPayload> {
  public static type = 'view-labels-pie-chart';
}
