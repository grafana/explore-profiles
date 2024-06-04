import { BusEventWithPayload } from '@grafana/data';

import { GridItemData } from '../types/GridItemData';

export interface EventShowPieChartPayload {
  item: GridItemData;
}

export class EventShowPieChart extends BusEventWithPayload<EventShowPieChartPayload> {
  public static type = 'show-pie-chart';
}
