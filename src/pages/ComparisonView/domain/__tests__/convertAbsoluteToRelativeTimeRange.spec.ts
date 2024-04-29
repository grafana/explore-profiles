import { RawTimeRange, TimeRange } from '@grafana/data';
import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

import { convertAbsoluteToRelativeTimeRange } from '../convertAbsoluteToRelativeTimeRange';
import { RelativeUnit } from '../getRelativeUnitForSync';

const unix = jest.fn();

jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
  toUtc: () => ({
    unix,
  }),
}));

type TestCase = [number, RelativeUnit, TimeRange, RawTimeRange];

const timeRange1 = translatePyroscopeTimeRangeToGrafana(
  '1712591960', // 2024-04-08 17:59:20
  '1712594120' // 2024-04-08 18:35:20
);

// now, unit, timeRange, expectedRaw
const cases: TestCase[] = [
  [1712683039, 's', timeRange1, { from: 'now-91080s', to: 'now-88910s' }],
  [1712683039, 'm', timeRange1, { from: 'now-1518m', to: 'now-1481m' }],
  [1712683039, 'h', timeRange1, { from: 'now-25h', to: 'now-24h' }],
  // to > now (can happen with some selections on the timeline)
  [
    1712683039,
    's',
    translatePyroscopeTimeRangeToGrafana('1712672039', '1712683500'),
    { from: 'now-11000s', to: 'now' },
  ],
];

describe('convertAbsoluteToRelativeTimeRange(timeRange)', () => {
  describe('if the time range passed is not absolute', () => {
    test('throws an error', () => {
      const relativeTimeRange = translatePyroscopeTimeRangeToGrafana('now-1h', 'now');

      expect(() => convertAbsoluteToRelativeTimeRange(relativeTimeRange, 's')).toThrow(
        new TypeError('The argument received is not an absolute time range (now-1h/now)!')
      );
    });
  });

  describe('if the unit passed is not supported', () => {
    test('throws an error', () => {
      expect(() => convertAbsoluteToRelativeTimeRange(timeRange1, 'd' as RelativeUnit)).toThrow(
        new Error('Unknown unit "d"!')
      );
    });
  });

  describe('otherwise', () => {
    test.each<TestCase>(cases)(
      'given that now=%d, unit = "%s" and %o, it returns %o',
      (now, unit, timeRange, expectedRaw) => {
        unix.mockReturnValue(now);

        const result = convertAbsoluteToRelativeTimeRange(timeRange, unit);

        expect(result.raw).toEqual(expectedRaw);

        expect(result.from).toBe(timeRange.from);
        expect(result.to).toBe(timeRange.to);
      }
    );
  });
});
