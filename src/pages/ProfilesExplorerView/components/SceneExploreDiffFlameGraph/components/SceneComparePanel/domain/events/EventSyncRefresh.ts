import { BusEventWithPayload } from '@grafana/data';

import { CompareTarget } from '../../../../domain/types';

interface EventSyncRefreshPayload {
  source: CompareTarget;
}

export class EventSyncRefresh extends BusEventWithPayload<EventSyncRefreshPayload> {
  public static type = 'sync-refresh';
}
