import { BusEventWithPayload } from '@grafana/data';

export interface EventShowPieChartPayload {
  params: Record<string, any>;
}

export class EventShowPieChart extends BusEventWithPayload<EventShowPieChartPayload> {
  public static type = 'show-pie-chart';
}
