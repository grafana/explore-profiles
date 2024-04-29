import { dateTime, TimeRange } from '@grafana/data';

import { parseTimeRangeFromUrl } from '../parseTimeRangeFromUrl';

type TestCase = [string[], URLSearchParams, TimeRange];

const cases: TestCase[] = [
  [
    ['from', 'until'],
    new URLSearchParams(),
    {
      from: dateTime(0),
      to: dateTime(0),
      raw: {
        from: dateTime(0),
        to: dateTime(0),
      },
    },
  ],
  [
    ['from', 'until'],
    new URLSearchParams([['from', '1710352800']]),
    {
      from: dateTime(1710352800 * 1000),
      to: dateTime(0),
      raw: {
        from: dateTime(1710352800 * 1000),
        to: dateTime(0),
      },
    },
  ],
  [
    ['from', 'until'],
    new URLSearchParams([['until', '1710355800']]),
    {
      from: dateTime(0),
      to: dateTime(1710355800 * 1000),
      raw: {
        from: dateTime(0),
        to: dateTime(1710355800 * 1000),
      },
    },
  ],
  [
    ['from', 'until'],
    new URLSearchParams([
      ['from', '1710352800'],
      ['until', '1710355800'],
    ]),
    {
      from: dateTime(1710352800 * 1000),
      to: dateTime(1710355800 * 1000),
      raw: {
        from: dateTime(1710352800 * 1000),
        to: dateTime(1710355800 * 1000),
      },
    },
  ],
  [
    ['from', 'until'],
    new URLSearchParams([
      ['start', '1710352800'],
      ['end', '1710355800'],
    ]),
    {
      from: dateTime(0),
      to: dateTime(0),
      raw: {
        from: dateTime(0),
        to: dateTime(0),
      },
    },
  ],
  [
    ['start', 'end'],
    new URLSearchParams([
      ['from', '1710352800'],
      ['until', '1710355800'],
    ]),
    {
      from: dateTime(0),
      to: dateTime(0),
      raw: {
        from: dateTime(0),
        to: dateTime(0),
      },
    },
  ],
  [
    ['leftFrom', 'leftUntil'],
    new URLSearchParams([
      ['leftFrom', '1710352800'],
      ['leftUntil', '1710355800'],
    ]),
    {
      from: dateTime(1710352800 * 1000),
      to: dateTime(1710355800 * 1000),
      raw: {
        from: dateTime(1710352800 * 1000),
        to: dateTime(1710355800 * 1000),
      },
    },
  ],
];

describe('parseTimeRangeFromUrl(paramNames, searchParams)', () => {
  test.each<TestCase>(cases)("given '%s' and %s, it returns %o", (paramNames, searchParams, expectedTimeRange) => {
    const result = parseTimeRangeFromUrl(paramNames, searchParams);

    expect(result.from).toEqual(expectedTimeRange.from);
    expect(result.to).toEqual(expectedTimeRange.to);

    expect(result.raw.from).toEqual(expectedTimeRange.raw.from);
    expect(result.raw.to).toEqual(expectedTimeRange.raw.to);
  });
});
