import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

import { getExportFilename } from '../getExportFilename';

describe('getFileName(timeRange, appName)', () => {
  describe('when all arguments are passed', () => {
    it('computes the correct filename', () => {
      const timeRange = translatePyroscopeTimeRangeToGrafana('1708210800', '1708297200'); // 2024-02-18 - 2024-02-19
      const filename = getExportFilename(timeRange, 'simple.golang.app.cpu');

      expect(filename).toBe('simple.golang.app.cpu_2024-02-17_2300-to-2024-02-18_2300');
    });
  });

  describe('when only "timeRange" passed', () => {
    it('computes the correct filename', () => {
      const timeRange = translatePyroscopeTimeRangeToGrafana('1708210800', '1708297200'); // 2024-02-18 - 2024-02-19
      const filename = getExportFilename(timeRange);

      expect(filename).toBe('flamegraph_2024-02-17_2300-to-2024-02-18_2300');
    });
  });
});
