import { parseQuery } from '../parseQuery';

describe('parseQuery(query)', () => {
  describe('if "query" is an empty string', () => {
    it('returns an "empty" object', () => {
      expect(parseQuery('')).toEqual({ serviceId: '', profileMetricId: '', labelsSelector: '' });
    });
  });

  describe('process_cpu:cpu:nanoseconds:cpu:nanoseconds{}', () => {
    it('returns the expected object', () => {
      expect(parseQuery('process_cpu:cpu:nanoseconds:cpu:nanoseconds{}')).toEqual({
        serviceId: '',
        profileMetricId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelsSelector: '{}',
      });
    });
  });

  describe('memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}', () => {
    it('returns the expected object', () => {
      expect(parseQuery('memory:alloc_space:bytes:space:bytes{service_name="pyroscope"}')).toEqual({
        serviceId: 'pyroscope',
        profileMetricId: 'memory:alloc_space:bytes:space:bytes',
        labelsSelector: '{service_name="pyroscope"}',
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
      });
    });
  });
});
