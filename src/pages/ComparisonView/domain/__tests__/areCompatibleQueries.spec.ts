import { areCompatibleQueries } from '../areCompatibleQueries';

type TestCase = [string, string, string, boolean];

const cases: TestCase[] = [
  ['', '', '', true],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    true,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app",region="ap-south"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    true,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app",region="eu-north"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app",region="us-east"}',
    true,
  ],
  ['process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}', '', '', false],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    false,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    false,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
    false,
  ],
  [
    'memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    false,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    false,
  ],
  [
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    'memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}',
    false,
  ],
];

describe('areCompatibleQueries(query, leftQuery, rightQuery)', () => {
  test.each<TestCase>(cases)(
    "given '%s', '%s' and '%s', it returns %s",
    (query, leftQuery, rightQuery, expectedResult) => {
      expect(areCompatibleQueries(query, leftQuery, rightQuery)).toBe(expectedResult);
    }
  );
});
