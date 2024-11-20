import { BusEventWithPayload } from '@grafana/data';

import { CompareTarget } from '../../../../domain/types';

interface EventEnableSyncTimeRangesPayload {
  source: CompareTarget;
  enable: boolean;
}

export class EventEnableSyncTimeRanges extends BusEventWithPayload<EventEnableSyncTimeRangesPayload> {
  public static type = 'enable-sync-timeranges';
}
