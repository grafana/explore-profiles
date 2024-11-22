import { BusEventWithPayload, TimeRange } from '@grafana/data';
import { SceneTimeRangeState } from '@grafana/scenes';

import { CompareTarget } from '../../../../domain/types';

interface EventEnableSyncTimeRangesPayload {
  source: CompareTarget;
  enable: boolean;
  timeRange: SceneTimeRangeState;
  annotationTimeRange: TimeRange;
}

export class EventEnableSyncTimeRanges extends BusEventWithPayload<EventEnableSyncTimeRangesPayload> {
  public static type = 'enable-sync-timeranges';
}
