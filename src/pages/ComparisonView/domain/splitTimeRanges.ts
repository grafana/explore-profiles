import { TimeRange } from '@grafana/data';

import { isRelativeTimeRange } from './isRelativeTimeRange';
import { splitAbsoluteTimeRange } from './splitAbsoluteTimeRange';
import { splitRelativeTimeRange } from './splitRelativeTimeRange';

export function splitTimeRanges(mainTimeRange: TimeRange, left: any, right: any) {
  if (isRelativeTimeRange(mainTimeRange)) {
    const [newLeft, newRight] = splitRelativeTimeRange(mainTimeRange);

    left.setTimeRange(newLeft, true);
    right.setTimeRange(newRight, true);
  } else {
    const [newLeft, newRight] = splitAbsoluteTimeRange(mainTimeRange);

    left.setTimeRange(newLeft);
    right.setTimeRange(newRight);
  }
}
