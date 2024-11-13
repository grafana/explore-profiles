import { clearLabelValue, excludeLabelValue, includeLabelValue, isFilterValid } from '../filters-ops';

const FILTER_VEHICLE_IS_BIKE = Object.freeze({ key: 'vehicle', operator: '=', value: 'bike' });

describe('includeLabelValue(filters, filterForInclude)', () => {
  test.each([
    [
      'empty filters', // test name
      [], // filters
      FILTER_VEHICLE_IS_BIKE, // filterForInclude
      [{ key: 'vehicle', operator: '=~', value: 'bike' }], // expected filters
    ],
    [
      'filters with a different label',
      [{ key: 'region', operator: '=~', value: 'eu-north' }],
      FILTER_VEHICLE_IS_BIKE,
      [
        { key: 'region', operator: '=~', value: 'eu-north' },
        { key: 'vehicle', operator: '=~', value: 'bike' },
      ],
    ],
    [
      'filters with the "in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '=~', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
    ],
    [
      'filters with the "not in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the "not in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the "not in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the "=" operator and the same label but different value',
      [{ key: 'vehicle', operator: '=', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
    ],
    [
      'filters with the "=" operator and the same label+value',
      [{ key: 'vehicle', operator: '=', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=', value: 'bike' }],
    ],
    [
      'filters with the the "!=" operator and the same label but different value',
      [{ key: 'vehicle', operator: '!=', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the the "!=" operator and the same label+value',
      [{ key: 'vehicle', operator: '!=', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
  ])('%s', (msg, filters, filterForInclude, expectedFilters) => {
    expect(includeLabelValue(filters, filterForInclude)).toEqual(expectedFilters);
  });
});

describe('excludeLabelValue(filters, filterForExclude)', () => {
  test.each([
    [
      'empty filters', // test name
      [], // filters
      FILTER_VEHICLE_IS_BIKE, // filterForExclude
      [{ key: 'vehicle', operator: '!~', value: 'bike' }], // expected filters
    ],
    [
      'filters with a different label',
      [{ key: 'region', operator: '=~', value: 'eu-north' }],
      FILTER_VEHICLE_IS_BIKE,
      [
        { key: 'region', operator: '=~', value: 'eu-north' },
        { key: 'vehicle', operator: '!~', value: 'bike' },
      ],
    ],
    [
      'filters with the "not in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
    ],
    [
      'filters with the "not in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the "not in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
    ],
    [
      'filters with the "in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '=~', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the "=" operator and the same label but different value',
      [{ key: 'vehicle', operator: '=', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the "=" operator and the same label+value',
      [{ key: 'vehicle', operator: '=', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
    ],
    [
      'filters with the the "!=" operator and the same label but different value',
      [{ key: 'vehicle', operator: '!=', value: 'car' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
    ],
    [
      'filters with the the "!=" operator and the same label+value',
      [{ key: 'vehicle', operator: '!=', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!=', value: 'bike' }],
    ],
  ])('%s', (msg, filters, filterForInclude, expectedFilters) => {
    expect(excludeLabelValue(filters, filterForInclude)).toEqual(expectedFilters);
  });
});

describe('clearLabelValue(filters, filterForClear)', () => {
  test.each([
    [
      'empty filters', // test name
      [], // filters
      FILTER_VEHICLE_IS_BIKE, // filterForClear
      [], // expected filters
    ],
    [
      'filters with a different label',
      [{ key: 'region', operator: '=~', value: 'eu-north' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'region', operator: '=~', value: 'eu-north' }],
    ],
    [
      'filters with the same label and the "in" operator #1',
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [],
    ],
    [
      'filters with the same label and the "in" operator #2',
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car' }],
    ],
    [
      'filters with the same label and the "not in" operator #1',
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [],
    ],
    [
      'filters with the same label and the "not in" operator #2',
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
    ],
    ['filters with the same label+value and the "=" operator', [FILTER_VEHICLE_IS_BIKE], FILTER_VEHICLE_IS_BIKE, []],
    [
      'filters with the same label+value and the "!=" operator',
      [{ key: 'vehicle', operator: '!=', value: 'bike' }],
      FILTER_VEHICLE_IS_BIKE,
      [],
    ],
  ])('%s', (msg, filters, filterForClear, expectedFilters) => {
    expect(clearLabelValue(filters, filterForClear)).toEqual(expectedFilters);
  });
});

describe('isFilterValid(filter)', () => {
  test.each([
    [{ key: 'cluster', operator: '', value: 'test' }, false],
    [{ key: 'cluster', operator: '%', value: 'test' }, false],
    [{ key: 'cluster', operator: '=', value: 'test' }, true],
    [{ key: 'cluster', operator: 'is-empty', value: 'test' }, true],
  ])('"%s" → %s', (filter, expectedResult) => {
    expect(isFilterValid(filter)).toBe(expectedResult);
  });
});
