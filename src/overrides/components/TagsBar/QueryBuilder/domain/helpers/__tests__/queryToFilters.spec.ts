import { FilterKind, Filters } from '../../types';
import { queryToFilters } from '../queryToFilters';

type TestCase = [string, Filters];

const expectedCountFilter = {
  attribute: {
    label: 'action',
    value: 'action',
  },
  id: expect.any(String),
  operator: {
    label: '=',
    value: '=',
  },
  type: FilterKind['attribute-operator-value'],
  value: {
    label: 'count',
    value: 'count',
  },
};

const cases: TestCase[] = [
  ['', []],
  ['{}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{service_name}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{"core-requests"}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{service_name/"core-requests"}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action=/"count"}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests"}', []],
  ['process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count"}', [expectedCountFilter]],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",controller!="admin/products"}',

    [
      expectedCountFilter,
      {
        attribute: {
          label: 'controller',
          value: 'controller',
        },
        id: expect.any(String),
        operator: {
          label: '!=',
          value: '!=',
        },
        type: FilterKind['attribute-operator-value'],
        value: {
          label: 'admin/products',
          value: 'admin/products',
        },
      },
    ],
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",pod_id=~"83|84"}',
    [
      expectedCountFilter,
      {
        attribute: {
          label: 'pod_id',
          value: 'pod_id',
        },
        id: expect.any(String),
        operator: {
          label: 'in',
          value: 'in',
        },
        type: FilterKind['attribute-operator-value'],
        value: {
          label: '83, 84',
          value: '83|84',
        },
      },
    ],
  ],
];

describe('queryToFilters(query: string)', () => {
  test.each<TestCase>(cases)("given '%s' as argument, it produces '%s'", (query, expectedFilters) => {
    expect(queryToFilters(query)).toEqual(expectedFilters);
  });
});
