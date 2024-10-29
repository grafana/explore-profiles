import { clearLabelValue, excludeLabelValue, includeLabelValue } from '../filters-ops';

const FILTER_VEHICLE_BIKE = Object.freeze({ key: 'vehicle', operator: '=', value: 'bike' });

describe('includeLabelValue(filters, filterToInclude)', () => {
  test.each([
    ['empty filters', [], FILTER_VEHICLE_BIKE, [{ key: 'vehicle', operator: '=~', value: 'bike' }]],
    [
      'filters with the "in" operator and a different label',
      [{ key: 'region', operator: '=~', value: 'eu-north' }],
      FILTER_VEHICLE_BIKE,
      [
        { key: 'region', operator: '=~', value: 'eu-north' },
        { key: 'vehicle', operator: '=~', value: 'bike' },
      ],
    ],
    [
      'filters with the "in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '=~', value: 'car' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the "in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'car|bike' }],
    ],
    [
      'filters with the "not in" operator and the same label but different value',
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
    ],
    [
      'filters with the "not in" operator and the same label+value #1',
      [{ key: 'vehicle', operator: '!~', value: 'bike' }],
      FILTER_VEHICLE_BIKE,
      [],
    ],
    [
      'filters with the "not in" operator and the same label+value #2',
      [{ key: 'vehicle', operator: '!~', value: 'car|bike' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '!~', value: 'car' }],
    ],
    [
      'filters with the "=" operator and the same label',
      [{ key: 'vehicle', operator: '=', value: 'car' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
    [
      'filters with the the "!=" operator and the same label',
      [{ key: 'vehicle', operator: '!=', value: 'car' }],
      FILTER_VEHICLE_BIKE,
      [{ key: 'vehicle', operator: '=~', value: 'bike' }],
    ],
  ])('%s', (msg, filters, filterToInclude, expectedFilters) => {
    expect(includeLabelValue(filters, filterToInclude)).toEqual(expectedFilters);
  });
});

describe('excludeLabelValue(filters, filterToExclude)', () => {
  test.each([['empty filters', [], FILTER_VEHICLE_BIKE, [{ key: 'vehicle', operator: '!~', value: 'bike' }]]])(
    '%s',
    (msg, filters, filterToInclude, expectedFilters) => {
      expect(excludeLabelValue(filters, filterToInclude)).toEqual(expectedFilters);
    }
  );
});

describe('clearLabelValue(filters, filterToClear)', () => {
  test.each([['empty filters', [], FILTER_VEHICLE_BIKE, []]])(
    '%s',
    (msg, filters, filterToInclude, expectedFilters) => {
      expect(clearLabelValue(filters, filterToInclude)).toEqual(expectedFilters);
    }
  );
});
