import { buildQuery, parseQuery } from '../parseQuery';

describe('parseQuery(query)', () => {
  describe('if "query" is an empty string', () => {
    it('returns an "empty" object', () => {
      expect(parseQuery('')).toEqual({ serviceId: '', profileMetricId: '', labelsSelector: '', labels: [] });
    });
  });

  describe('process_cpu:cpu:nanoseconds:cpu:nanoseconds{}', () => {
    it('returns the expected object', () => {
      expect(parseQuery('process_cpu:cpu:nanoseconds:cpu:nanoseconds{}')).toEqual({
        serviceId: '',
        profileMetricId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelsSelector: '{}',
        labels: [],
      });
    });
  });

  describe('memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}', () => {
    it('returns the expected object', () => {
      expect(parseQuery('memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}')).toEqual({
        serviceId: 'pyroscope',
        profileMetricId: 'memory:alloc_space:bytes:space:bytes',
        labelsSelector: '{service_name="pyroscope"}',
        labels: [],
      });
    });
  });

  describe('process_cpu:samples:count:cpu:nanoseconds{service_name="ride-sharing-app",vehicle="car"}', () => {
    it('returns the expected object', () => {
      expect(
        parseQuery('process_cpu:samples:count:cpu:nanoseconds{service_name="ride-sharing-app",vehicle="car"}')
      ).toEqual({
        serviceId: 'ride-sharing-app',
        profileMetricId: 'process_cpu:samples:count:cpu:nanoseconds',
        labelsSelector: '{service_name="ride-sharing-app",vehicle="car"}',
        labels: ['vehicle="car"'],
      });
    });
  });
});

describe('buildQuery({ serviceId, profileMetricId, labels })', () => {
  describe('if "labels" is falsy', () => {
    it('returns the expected query', () => {
      expect(buildQuery({ serviceId: 'pyroscope', profileMetricId: 'memory:alloc_space:bytes:space:bytes' })).toBe(
        'memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}'
      );
    });
  });

  describe('if "labels" is an empty array', () => {
    it('returns the expected query', () => {
      expect(
        buildQuery({
          serviceId: 'pyroscope',
          profileMetricId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
          labels: [],
        })
      ).toBe('process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}');
    });
  });

  describe('if "labels" is a non-empty array', () => {
    it('returns the expected query', () => {
      expect(
        buildQuery({
          serviceId: 'pyroscope',
          profileMetricId: 'memory:alloc_space:bytes:space:bytes',
          labels: ['hostname="fire007"', 'pod="exxya"'],
        })
      ).toBe('memory:alloc_space:bytes:space:bytes{service_name="pyroscope",hostname="fire007",pod="exxya"}');
    });
  });
});
