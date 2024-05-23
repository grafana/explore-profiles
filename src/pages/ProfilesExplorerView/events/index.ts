import { EventExplore, EventExplorePayload } from './EventExplore';
import { EventSelect, EventSelectPayload } from './EventSelect';

type EventContructor =
  | (new (payload: EventExplorePayload) => EventExplore)
  | (new (payload: EventSelectPayload) => EventSelect);

export const Events = new Map<string, EventContructor>([
  ['EventExplore', EventExplore],
  ['EventSelect', EventSelect],
]);
