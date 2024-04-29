import { TimeRange } from '@grafana/data';

import { convertAbsoluteToRelativeTimeRange } from './convertAbsoluteToRelativeTimeRange';
import { convertRelativeToAbsoluteTimeRange } from './convertRelativeToAbsoluteTimeRange';
import { getRelativeUnitForSync } from './getRelativeUnitForSync';
import { isRelativeTimeRange } from './isRelativeTimeRange';

/**
 * Ensures that the 3 timelines are set in absolute or relative "mode"
 * So that, in relative mode, they do not get out of sync as time passes
 */
export function syncTimelineModes(mainTimeRange: TimeRange, left: any, right: any) {
  if (isRelativeTimeRange(mainTimeRange)) {
    if (!isRelativeTimeRange(left.timeRange) || !isRelativeTimeRange(right.timeRange)) {
      const unit = getRelativeUnitForSync(mainTimeRange);

      left.setTimeRange(convertAbsoluteToRelativeTimeRange(left.timeRange, unit));
      right.setTimeRange(convertAbsoluteToRelativeTimeRange(right.timeRange, unit));
    }
  } else {
    if (isRelativeTimeRange(left.timeRange) || isRelativeTimeRange(right.timeRange)) {
      left.setTimeRange(convertRelativeToAbsoluteTimeRange(left.timeRange));
      right.setTimeRange(convertRelativeToAbsoluteTimeRange(right.timeRange));
    }
  }
}
