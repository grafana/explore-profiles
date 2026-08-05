import { SelectHeatmapResponse } from '@shared/pyroscope-api/querier/v1/querier_pb';
import { HeatmapSeries } from '@shared/pyroscope-api/types/v1/types_pb';

import {
  buildExemplarDataFrame,
  buildHeatmapDataFrame,
  buildHighlightedExemplarDataFrame,
  extractExemplarRows,
} from '../buildHeatmapDataFrames';

describe('buildHeatmapDataFrame', () => {
  it('adds one zero-count column to calibrate a sparse initial timestamp gap', () => {
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
      1000, 2000, 4000, 5000,
    ]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 2, 0, 0, 3, 4, 5, 6]);
  });

  it('does not add a calibration column when the first two slots are one step apart', () => {
    const series = {
      slots: [
        { timestamp: 1000, yMin: [0, 10], counts: [1, 2] },
        { timestamp: 2000, yMin: [0, 10], counts: [3, 4] },
      ],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms', undefined, 1000);

    expect(frame?.fields.find((field) => field.name === 'xMax')?.values).toEqual([1000, 1000, 2000, 2000]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 2, 3, 4]);
  });

  it('uses the requested step when omitted slots make timestamps sparse', () => {
    const series = {
      slots: [
        { timestamp: 1000, yMin: [0], counts: [1] },
        { timestamp: 3000, yMin: [0], counts: [2] },
      ],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms', undefined, 1000);

    expect([...new Set(frame?.fields.find((field) => field.name === 'xMax')?.values)]).toEqual([1000, 2000, 3000]);
  });

  it('adds a complete calibration column for a single slot when the requested step is known', () => {
    const series = {
      slots: [{ timestamp: 1000, yMin: [0, 10], counts: [1, 2] }],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms', undefined, 1000);

    expect(frame?.fields.find((field) => field.name === 'xMax')?.values).toEqual([1000, 1000, 2000, 2000]);
    expect(frame?.fields.find((field) => field.name === 'yMin')?.values).toEqual([0, 10, 0, 10]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 2, 0, 0]);
  });

  it('preserves a nonzero bucket origin so Grafana infers the correct cell height', () => {
    const series = {
      slots: [{ timestamp: 1000, yMin: [10, 604, 1198], counts: [1, 2, 3] }],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms');
    const yMinValues = frame?.fields.find((field) => field.name === 'yMin')?.values;

    expect(yMinValues).toEqual([10, 604, 1198]);
    expect(yMinValues![1] - yMinValues![0]).toBe(594);
  });

  it('collapses duplicate bucket starts so Grafana infers the correct cell width', () => {
    const duplicateBuckets = Array(20).fill(10_000_000);
    const counts = [...Array(19).fill(0), 1];
    const series = {
      slots: [
        { timestamp: 1000, yMin: duplicateBuckets, counts },
        { timestamp: 2000, yMin: duplicateBuckets, counts },
      ],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ns');

    expect(frame?.fields.find((field) => field.name === 'xMax')?.values).toEqual([1000, 2000]);
    expect(frame?.fields.find((field) => field.name === 'yMin')?.values).toEqual([10_000_000, 10_000_000]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 1]);
  });

  it('sums counts from duplicate bucket starts without mutating the response', () => {
    const yMin = [0, 10, 10, 20];
    const counts = [1, 2, 3, 4];
    const series = {
      slots: [{ timestamp: 1000, yMin, counts }],
    } as unknown as HeatmapSeries;

    const frame = buildHeatmapDataFrame(series, 'ms');

    expect(frame?.fields.find((field) => field.name === 'yMin')?.values).toEqual([0, 10, 20]);
    expect(frame?.fields.find((field) => field.name === 'count')?.values).toEqual([1, 5, 4]);
    expect(yMin).toEqual([0, 10, 10, 20]);
    expect(counts).toEqual([1, 2, 3, 4]);
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

describe('buildHighlightedExemplarDataFrame', () => {
  it('selects the exact exemplar when a span ID occurs at multiple timestamps', () => {
    const response = {
      series: [
        {
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
    const frame = buildExemplarDataFrame(response, 'ns');

    expect(buildHighlightedExemplarDataFrame(frame!, 'span-a', 2)?.fields.map(({ values }) => values)).toEqual([
      [2],
      [20],
      ['span-a'],
      ['true'],
    ]);
  });
});
