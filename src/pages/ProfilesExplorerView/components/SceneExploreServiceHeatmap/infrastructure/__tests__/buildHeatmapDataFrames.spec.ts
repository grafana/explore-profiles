import { SelectHeatmapResponse } from '@shared/pyroscope-api/querier/v1/querier_pb';
import { HeatmapSeries } from '@shared/pyroscope-api/types/v1/types_pb';

import { buildHeatmapDataFrame, extractExemplarRows } from '../buildHeatmapDataFrames';

describe('buildHeatmapDataFrame', () => {
  it('fills timestamp gaps with zero-count columns without changing the linear y shape', () => {
    const series = {
      slots: [
        { timestamp: 1000, yMin: [0, 10], counts: [1, 2] },
        { timestamp: 4000, yMin: [0, 10], counts: [3, 4] },
        { timestamp: 5000, yMin: [0, 10], counts: [5, 6] },
      ],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms');

    expect(frame?.fields.map((field) => field.name)).toEqual(['xMax', 'yMin', 'count']);
    expect([...new Set(frame?.fields.find((field) => field.name === 'xMax')?.values)]).toEqual([
      1000, 2000, 3000, 4000, 5000,
    ]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 2, 0, 0, 0, 0, 3, 4, 5, 6]);
    expect(frame?.meta?.custom).toEqual({ yBucketSize: 10 });
  });
});

describe('extractExemplarRows', () => {
  it('preserves duplicate span IDs at different timestamps', () => {
    const response = {
      series: [
        {
          labels: [{ name: 'span_name', value: 'GET /api' }],
          slots: [
            {
              exemplars: [
                { profileId: 'profile-1', spanId: 'span-a', timestamp: 1, value: 10, labels: [] },
                { profileId: 'profile-2', spanId: 'span-a', timestamp: 2, value: 20, labels: [] },
              ],
            },
          ],
        },
      ],
    } as unknown as SelectHeatmapResponse;

    expect(extractExemplarRows(response)).toEqual([
      { profileId: 'profile-2', timestamp: 2, value: 20, spanId: 'span-a', spanName: 'GET /api' },
      { profileId: 'profile-1', timestamp: 1, value: 10, spanId: 'span-a', spanName: 'GET /api' },
    ]);
  });
});
