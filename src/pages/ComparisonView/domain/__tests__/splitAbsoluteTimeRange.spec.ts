import { dateTime, TimeRange } from '@grafana/data';

import { splitAbsoluteTimeRange } from '../splitAbsoluteTimeRange';

type TestCase = [TimeRange, TimeRange[]];

const buildTimeRange = (from: number, to: number) => ({
  from: dateTime(from * 1000),
  to: dateTime(to * 1000),
  raw: {
    from: dateTime(from * 1000),
    to: dateTime(to * 1000),
  },
});

const cases: TestCase[] = [
  [
    buildTimeRange(1711388000, 1711388500), // (1711388500 - 1711388000) / 2 = 250
    [buildTimeRange(1711388000, 1711388000 + 250), buildTimeRange(1711388000 + 250, 1711388500)],
  ],
];

describe('splitAbsoluteTimeRange(timeRange)', () => {
  test.each<TestCase>(cases)('given %o, it returns %s', (timeRange, [expectedLeft, expectedRight]) => {
    const [left, right] = splitAbsoluteTimeRange(timeRange);

    expect(left).toEqual(expectedLeft);
    expect(right).toEqual(expectedRight);
  });
});
