import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

import { getExportFilename } from '../getExportFilename';

describe('getFileName(query, timeRange)', () => {
  it('computes the correct filename', () => {
    const timeRange = translatePyroscopeTimeRangeToGrafana('1708210800', '1708297200'); // 2024-02-18 - 2024-02-19
    const filename = getExportFilename(
      'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="alerting-ops/grafana",}',
      timeRange
    );

    expect(filename).toBe(
      'alerting-ops-grafana_process_cpu:cpu:nanoseconds:cpu:nanoseconds_2024-02-17_2300-to-2024-02-18_2300'
    );
  });
});
