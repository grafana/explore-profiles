import { FilterKind, Filters } from '../../types';
import { queryToFilters } from '../queryToFilters';

type TestCase = [string, Filters];

const expectedCountFilter = {
  id: expect.any(String),
  type: FilterKind['attribute-operator-value'],
  active: true,
  attribute: {
    label: 'action',
    value: 'action',
  },
  operator: {
    label: '=',
    value: '=',
  },
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
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'controller',
          value: 'controller',
        },
        operator: {
          label: '!=',
          value: '!=',
        },
        value: {
          label: 'admin/products',
          value: 'admin/products',
        },
      },
    ],
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",span_name=""}',
    [
      expectedCountFilter,
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator'],
        active: true,
        attribute: {
          label: 'span_name',
          value: 'span_name',
        },
        operator: {
          label: 'is empty',
          value: 'is-empty',
        },
        value: {
          label: '',
          value: 'is-empty',
        },
      },
    ],
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",pod_id!~"83|84"}',
    [
      expectedCountFilter,

      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'pod_id',
          value: 'pod_id',
        },
        operator: {
          label: 'not in',
          value: 'not-in',
        },
        value: {
          label: '83, 84',
          value: '83|84',
        },
      },
    ],
  ],
  [
    'process_cpu:wall:nanoseconds:wall:nanoseconds{service_name="core-requests",action="count",pod_id=~"83|84"}',
    [
      expectedCountFilter,
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'pod_id',
          value: 'pod_id',
        },
        operator: {
          label: 'in',
          value: 'in',
        },
        value: {
          label: '83, 84',
          value: '83|84',
        },
      },
    ],
  ],
  [
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",free_text=~"one,two"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'free_text',
          value: 'free_text',
        },
        operator: {
          label: '=~',
          value: '=~',
        },
        value: {
          label: 'one,two',
          value: 'one,two',
        },
      },
    ],
  ],
  [
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",free_text!~"three,four"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'free_text',
          value: 'free_text',
        },
        operator: {
          label: '!~',
          value: '!~',
        },
        value: {
          label: 'three,four',
          value: 'three,four',
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
