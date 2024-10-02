import { FilterKind, Filters } from '../../types';
import { filtersToQuery } from '../filtersToQuery';

const actionFilter = {
  id: '5epq3GXZmI',
  type: FilterKind['attribute-operator-value'],
  active: true,
  attribute: {
    value: 'action',
    label: 'action',
  },
  operator: {
    value: '=',
    label: '=',
  },
  value: {
    value: 'count',
    label: 'count',
  },
};

const partialControllerFilter = {
  id: 'o60y4DfivA',
  type: FilterKind.partial,
  active: false,
  attribute: {
    value: 'controller',
    label: 'controller',
  },
  operator: {
    value: '!=',
    label: '!=',
  },
};

const controllerFilter = {
  ...partialControllerFilter,
  type: FilterKind['attribute-operator-value'],
  value: {
    value: 'admin/products',
    label: 'admin/products',
  },
};

const spanNameFilter = {
  id: 'Jryvc2BpaM',
  type: FilterKind['attribute-operator'],
  active: true,
  attribute: {
    value: 'span_name',
    label: 'span_name',
  },
  operator: {
    value: 'is-empty',
    label: 'is empty',
  },
  value: {
    value: '',
    label: '',
  },
};

const podIdFilter = {
  id: 'CnxcVO7uQE',
  type: FilterKind['attribute-operator-value'],
  active: true,
  attribute: {
    value: 'pod_id',
    label: 'pod_id',
  },
  operator: {
    value: 'in',
    label: 'in',
  },
  value: {
    value: '83|84',
    label: '83, 84',
  },
};

const vehicleFilter = {
  id: 'YoH3Bnu4iX',
  type: FilterKind['attribute-operator-value'],
  active: true,
  attribute: {
    value: 'region',
    label: 'region',
  },
  operator: {
    value: 'not-in',
    label: 'not in',
  },
  value: {
    value: 'eu|us',
    label: 'eu, us',
  },
};

type TestCase = [string, Filters, string];

const cases: TestCase[] = [
  ['', [], ''],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{}', [], 'process_cpu:wall:nanoseconds:wall:nanoseconds{}'],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
  ],
  // with partial filter
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [partialControllerFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter, partialControllerFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count"}',
  ],
  // with complete filters
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count"}',
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter, controllerFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",controller!="admin/products"}',
  ],
  // with complete filters: is-empty operator
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter, spanNameFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",span_name=""}',
  ],
  // with complete filters: in operator
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter, podIdFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",pod_id=~"83|84"}',
  ],
  // with complete filters: not in operator
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}',
    [actionFilter, vehicleFilter],
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",region!~"eu|us"}',
  ],
];

describe('filtersToQuery(query: string, filters: Filters)', () => {
  test.each<TestCase>(cases)("given '%s' and %o as arguments, it produces '%s'", (query, filters, expectedQuery) => {
    expect(filtersToQuery(query, filters)).toBe(expectedQuery);
  });
});
