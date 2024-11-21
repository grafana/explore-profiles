import { BusEventWithPayload, TimeRange } from '@grafana/data';
import { SceneTimeRangeState } from '@grafana/scenes';

import { CompareTarget } from '../../../../domain/types';

interface EventSyncTimeRangesPayload {
  source: CompareTarget;
  timeRange?: SceneTimeRangeState;
  annotationTimeRange?: TimeRange;
}

export class EventSyncTimeRanges extends BusEventWithPayload<EventSyncTimeRangesPayload> {
  public static type = 'sync-timeranges';
}
