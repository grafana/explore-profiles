import { BusEventWithPayload } from '@grafana/data';

import { ExplorationType } from '../variables/ExplorationTypeVariable';

export interface EventSelectPayload {
  explorationType: ExplorationType;
  params: Record<string, any>;
}

export class EventSelect extends BusEventWithPayload<EventSelectPayload> {
  public static type = 'select-item';
}
