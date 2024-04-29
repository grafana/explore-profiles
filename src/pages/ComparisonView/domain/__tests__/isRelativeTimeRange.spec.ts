import { TimeRange } from '@grafana/data';
import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

import { isRelativeTimeRange } from '../isRelativeTimeRange';

type TestCase = [TimeRange, boolean];

const cases: TestCase[] = [
  [translatePyroscopeTimeRangeToGrafana('now-1h', 'now'), true],
  [translatePyroscopeTimeRangeToGrafana('now-6h', 'now-5m'), true],
  [translatePyroscopeTimeRangeToGrafana('1711388120', 'now'), false],
  [translatePyroscopeTimeRangeToGrafana('now-1h', '1711388510'), false],
  [translatePyroscopeTimeRangeToGrafana('1711388120', '1711388510'), false],
];

describe('isRelativeTimeRange(timeRange)', () => {
  test.each<TestCase>(cases)('given %o, it returns %s', (timeRange, expectedResult) => {
    expect(isRelativeTimeRange(timeRange)).toBe(expectedResult);
  });
});
