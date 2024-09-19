import { getExportFilename } from '../getExportFilename';

describe('getFileName(appName)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        search:
          '?explorationType=diff-flame-graph&var-serviceName=pyroscope&var-profileMetricId=process_cpu:cpu:nanoseconds:cpu:nanoseconds&var-dataSource=grafanacloud-profiles-local-a&var-groupBy=all&maxNodes=128&var-filters=&from-2=now-30m&to-2=now&from-3=now-30m&to-3=now&diffFrom=2024-09-16T12:21:51.298Z&diffTo=2024-09-16T12:25:35.688Z&diffFrom-2=2024-09-16T12:31:56.176Z&diffTo-2=2024-09-16T12:34:56.664Z',
      },
      writable: true,
    });
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('when "appName" is passed', () => {
    it('computes the correct filename', () => {
      const filename = getExportFilename('simple.golang.app.cpu');

      expect(filename).toBe(
        'simple.golang.app.cpu_baseline_2024-09-16_1221-to-2024-09-16_1225_comparison_2024-09-16_1231-to-2024-09-16_1234'
      );
    });
  });

  describe('when "appName" is not passed', () => {
    it('computes the correct filename', () => {
      const filename = getExportFilename();

      expect(filename).toBe(
        'flamegraph_baseline_2024-09-16_1221-to-2024-09-16_1225_comparison_2024-09-16_1231-to-2024-09-16_1234'
      );
    });
  });
});
