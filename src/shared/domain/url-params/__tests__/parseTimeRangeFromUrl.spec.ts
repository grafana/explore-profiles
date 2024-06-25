import { dateTime, TimeRange } from '@grafana/data';

import { parseTimeRangeFromUrl } from '../parseTimeRangeFromUrl';

type TestCase = [string[], URLSearchParams, TimeRange];

const cases: TestCase[] = [
  [
    ['from', 'to'],
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
    ['from', 'to'],
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
    ['from', 'to'],
    new URLSearchParams([['to', '1710355800']]),
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
    ['from', 'to'],
    new URLSearchParams([
      ['from', '1710352800'],
      ['to', '1710355800'],
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
    ['from', 'to'],
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
      ['to', '1710355800'],
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
