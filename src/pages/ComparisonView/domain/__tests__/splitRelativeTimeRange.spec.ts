import { TimeRange } from '@grafana/data';
import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

import { splitRelativeTimeRange } from '../splitRelativeTimeRange';

type TestCase = [TimeRange, TimeRange[]];

const cases: TestCase[] = [
  // correct split
  [
    translatePyroscopeTimeRangeToGrafana('now-10s', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-10s', 'now-5s'), translatePyroscopeTimeRangeToGrafana('now-5s', 'now')],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-30m', 'now'),
    [
      translatePyroscopeTimeRangeToGrafana('now-30m', 'now-15m'),
      translatePyroscopeTimeRangeToGrafana('now-15m', 'now'),
    ],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-15m', 'now'),
    [
      translatePyroscopeTimeRangeToGrafana('now-15m', 'now-450s'),
      translatePyroscopeTimeRangeToGrafana('now-450s', 'now'),
    ],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-2h', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-2h', 'now-1h'), translatePyroscopeTimeRangeToGrafana('now-1h', 'now')],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-1h', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-1h', 'now-30m'), translatePyroscopeTimeRangeToGrafana('now-30m', 'now')],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-6d', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-6d', 'now-3d'), translatePyroscopeTimeRangeToGrafana('now-3d', 'now')],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-7d', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-7d', 'now-84h'), translatePyroscopeTimeRangeToGrafana('now-84h', 'now')],
  ],
  // no split
  [
    translatePyroscopeTimeRangeToGrafana('now-3m', 'now-1m'),
    [
      translatePyroscopeTimeRangeToGrafana('now-3m', 'now-1m'),
      translatePyroscopeTimeRangeToGrafana('now-3m', 'now-1m'),
    ],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-6M', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-6M', 'now'), translatePyroscopeTimeRangeToGrafana('now-6M', 'now')],
  ],
  [
    translatePyroscopeTimeRangeToGrafana('now-21s', 'now'),
    [translatePyroscopeTimeRangeToGrafana('now-21s', 'now'), translatePyroscopeTimeRangeToGrafana('now-21s', 'now')],
  ],
];

describe('splitRelativeTimeRange(timeRange)', () => {
  test.each<TestCase>(cases)('given %o, it returns %o', (timeRange, [expectedLeft, expectedRight]) => {
    const [left, right] = splitRelativeTimeRange(timeRange);

    expect(left.raw).toEqual(expectedLeft.raw);
    expect(right.raw).toEqual(expectedRight.raw);
  });
});
