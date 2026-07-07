import { FilterKind, Filters } from '../../types';
import { parseRawFilters, queryToFilters } from '../queryToFilters';

type ParseRawFiltersTestCase = [string, string[][]];

const parseRawFiltersCases: ParseRawFiltersTestCase[] = [
  // empty / no matches
  ['', []],
  ['service_name="foo"', [['service_name', '=', 'foo']]],
  [
    'action="count",region!="us-east-1"',
    [
      ['action', '=', 'count'],
      ['region', '!=', 'us-east-1'],
    ],
  ],
  ['pod_id=~"83|84"', [['pod_id', '=~', '83|84']]],
  ['span_name!~"grpc.*"', [['span_name', '!~', 'grpc.*']]],
  ['span_name=""', [['span_name', '=', '']]],
  // UTF-8 / quoted label names — quotes are stripped from the returned attribute
  ['"http.method"="GET"', [['http.method', '=', 'GET']]],
  ['"k8s.node.name"!="node-1"', [['k8s.node.name', '!=', 'node-1']]],
  ['"emoji.🔥"="hot-path"', [['emoji.🔥', '=', 'hot-path']]],
  ['"my label with spaces"=~"foo|bar"', [['my label with spaces', '=~', 'foo|bar']]],
  // label name containing escaped double quotes — unescaped on parse
  ['"label\\"with\\"quotes"="tricky"', [['label"with"quotes', '=', 'tricky']]],
  // label name containing escaped backslash — unescaped on parse
  ['"back\\\\slash"="val"', [['back\\slash', '=', 'val']]],
  // value containing escaped backslash
  ['key="val\\\\ue"', [['key', '=', 'val\\ue']]],
  // mix of regular and quoted label names
  [
    'region="us-east-1","http.method"="GET"',
    [
      ['region', '=', 'us-east-1'],
      ['http.method', '=', 'GET'],
    ],
  ],
  // label name starting with digit should not match (not a valid legacy label name)
  ['0invalid="value"', []],
];

describe('parseRawFilters(rawFilters: string)', () => {
  test.each<ParseRawFiltersTestCase>(parseRawFiltersCases)("given '%s', returns %j", (input, expected) => {
    expect(parseRawFilters(input)).toEqual(expected);
  });
});

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
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",method=~"GET"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'method',
          value: 'method',
        },
        operator: {
          label: 'in',
          value: 'in',
        },
        value: {
          label: 'GET',
          value: 'GET',
        },
      },
    ],
  ],
  [
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",method!~"GET"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'method',
          value: 'method',
        },
        operator: {
          label: 'not in',
          value: 'not-in',
        },
        value: {
          label: 'GET',
          value: 'GET',
        },
      },
    ],
  ],
  [
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",region=~"eu.+"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'region',
          value: 'region',
        },
        operator: {
          label: '=~',
          value: '=~',
        },
        value: {
          label: 'eu.+',
          value: 'eu.+',
        },
      },
    ],
  ],
  [
    ' process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="core-requests",region!~"us.*"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'region',
          value: 'region',
        },
        operator: {
          label: '!~',
          value: '!~',
        },
        value: {
          label: 'us.*',
          value: 'us.*',
        },
      },
    ],
  ],
  // UTF-8 / quoted label names
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="svc","http.method"="GET"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: { label: 'http.method', value: 'http.method' },
        operator: { label: '=', value: '=' },
        value: { label: 'GET', value: 'GET' },
      },
    ],
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="svc","k8s.node.name"!="node-1"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: { label: 'k8s.node.name', value: 'k8s.node.name' },
        operator: { label: '!=', value: '!=' },
        value: { label: 'node-1', value: 'node-1' },
      },
    ],
  ],
  [
    'query process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope-rideshare-go",hostname=~"r{1}"}',
    [
      {
        id: expect.any(String),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: {
          label: 'hostname',
          value: 'hostname',
        },
        operator: {
          label: '=~',
          value: '=~',
        },
        value: {
          label: 'r{1}',
          value: 'r{1}',
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
