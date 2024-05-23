import { BusEventWithPayload } from '@grafana/data';

import { ExplorationType } from '../variables/ExplorationTypeVariable';

export interface EventExplorePayload {
  explorationType: ExplorationType;
  params: Record<string, any>;
}

export class EventExplore extends BusEventWithPayload<EventExplorePayload> {
  public static type = 'explore-item';
}
