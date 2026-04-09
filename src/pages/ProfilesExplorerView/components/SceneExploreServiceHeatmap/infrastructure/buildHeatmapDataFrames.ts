import { DataFrameType, DataTopic, FieldType, MutableDataFrame } from '@grafana/data';
import { ScaleDistribution, ScaleDistributionConfig } from '@grafana/schema';
import { SelectHeatmapResponse } from '@shared/pyroscope-api/querier/v1/querier_pb';
import { HeatmapSeries } from '@shared/pyroscope-api/types/v1/types_pb';

type HeatmapSlot = HeatmapSeries['slots'][number];

export interface ExemplarRow {
  profileId: string;
  timestamp: number;
  value: number;
  spanId?: string;
  spanName?: string;
}

/**
 * Builds a sparse "heatmap-cells" DataFrame from a HeatmapSeries, matching the format
 * produced by the Grafana backend in heatmap/heatmap.go (PR #120995).
 *
 * Only non-zero cells are emitted. A gap-filling calibration row is inserted after the
 * first slot when consecutive timestamps are more than one step apart, so the frontend
 * panel can infer the correct bucket width.
 *
 * Fields: xMax (Time), yMin (Number, unit), yMax (Number, unit), count (Number).
 * frame.meta.type = DataFrameType.HeatmapCells
 */
export function buildHeatmapDataFrame(
  series: HeatmapSeries,
  unit: string,
  scaleDistribution: ScaleDistributionConfig = { type: ScaleDistribution.Linear }
): MutableDataFrame | null {
  const slots = series?.slots;
  if (!slots?.length) {
    return null;
  }

  const sortedSlots = [...slots].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  const xMaxValues: number[] = [];
  const yMinValues: number[] = [];
  const countValues: number[] = [];

  const firstSlot = sortedSlots[0];
  const yBucketSize = firstSlot.yMin.length > 1 ? firstSlot.yMin[1] - firstSlot.yMin[0] : firstSlot.yMin[0];
  const minBucketStart = Math.min(...sortedSlots.map((slot) => slot.yMin[0] ?? 0));

  const lowerBucketStarts = buildLowerBucketStarts(yBucketSize, minBucketStart);
  const yBucketStarts = buildYBucketStarts(sortedSlots, lowerBucketStarts);
  const xBucketSize = getXBucketSize(sortedSlots);

  appendHeatmapSlots(sortedSlots, lowerBucketStarts, yBucketStarts, xBucketSize, xMaxValues, yMinValues, countValues);

  if (xMaxValues.length === 0) {
    return null;
  }

  // The panel reads meta.custom.yBucketSize for cell sizing in the dense/linear path.

  // isHeatmapCellsDense returns true iff the frame has exactly one field named 'y', 'yMin',
  // or 'yMax'. With only yMin present it returns true -> the panel respects
  // fields[1].config.custom.scaleDistribution and uses the linear scale.
  const frame = new MutableDataFrame({
    name: 'heatmap',
    meta: {
      type: DataFrameType.HeatmapCells,
      custom: { yBucketSize },
    },
    fields: [
      { name: 'xMax', type: FieldType.time, values: xMaxValues, config: {} },
      { name: 'yMin', type: FieldType.number, values: yMinValues, config: { unit, custom: { scaleDistribution } } },
      { name: 'count', type: FieldType.number, values: countValues, config: {} },
    ],
  });

  return frame;
}

function buildLowerBucketStarts(yBucketSize: number, minBucketStart: number): number[] {
  const lowerBucketStarts: number[] = [];

  if (yBucketSize <= 0 || minBucketStart <= 0) {
    return lowerBucketStarts;
  }

  for (let bucketStart = 0; bucketStart < minBucketStart; bucketStart += yBucketSize) {
    lowerBucketStarts.push(bucketStart);
  }

  return lowerBucketStarts;
}

function buildYBucketStarts(slots: HeatmapSlot[], lowerBucketStarts: number[]): number[] {
  const bucketStarts = new Set(lowerBucketStarts);

  for (const slot of slots) {
    for (const bucketStart of slot.yMin) {
      bucketStarts.add(bucketStart);
    }
  }

  return [...bucketStarts].sort((a, b) => a - b);
}

function getXBucketSize(slots: HeatmapSlot[]): number {
  const timestamps = slots.map((slot) => Number(slot.timestamp)).sort((a, b) => a - b);
  const diffs = timestamps
    .slice(1)
    .map((timestamp, index) => timestamp - timestamps[index])
    .filter((diff) => diff > 0);

  return diffs.length > 0 ? Math.min(...diffs) : 0;
}

function appendEmptyHeatmapSlot(
  xMax: number,
  yBucketStarts: number[],
  xMaxValues: number[],
  yMinValues: number[],
  countValues: number[]
) {
  for (const bucketStart of yBucketStarts) {
    xMaxValues.push(xMax);
    yMinValues.push(bucketStart);
    countValues.push(0);
  }
}

function appendHeatmapSlots(
  slots: HeatmapSlot[],
  lowerBucketStarts: number[],
  yBucketStarts: number[],
  xBucketSize: number,
  xMaxValues: number[],
  yMinValues: number[],
  countValues: number[]
) {
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const previousSlot = slots[i - 1];

    appendMissingHeatmapSlots(previousSlot, slot, yBucketStarts, xBucketSize, xMaxValues, yMinValues, countValues);
    appendHeatmapSlot(slot, lowerBucketStarts, xMaxValues, yMinValues, countValues);
  }
}

function appendMissingHeatmapSlots(
  previousSlot: HeatmapSlot | undefined,
  slot: HeatmapSlot,
  yBucketStarts: number[],
  xBucketSize: number,
  xMaxValues: number[],
  yMinValues: number[],
  countValues: number[]
) {
  if (!previousSlot || xBucketSize <= 0) {
    return;
  }

  const slotTimestamp = Number(slot.timestamp);
  for (let xMax = Number(previousSlot.timestamp) + xBucketSize; xMax < slotTimestamp; xMax += xBucketSize) {
    appendEmptyHeatmapSlot(xMax, yBucketStarts, xMaxValues, yMinValues, countValues);
  }
}

function appendHeatmapSlot(
  slot: HeatmapSlot,
  lowerBucketStarts: number[],
  xMaxValues: number[],
  yMinValues: number[],
  countValues: number[]
) {
  const xMax = Number(slot.timestamp);
  const { yMin, counts } = slot;

  for (const bucketStart of lowerBucketStarts) {
    xMaxValues.push(xMax);
    yMinValues.push(bucketStart);
    countValues.push(0);
  }

  // Emit all buckets including zeros so the panel knows the full y extent.
  for (let j = 0; j < counts.length; j++) {
    xMaxValues.push(xMax);
    yMinValues.push(yMin[j]);
    countValues.push(counts[j]);
  }
}

interface CollectedExemplar {
  timestamp: number;
  value: number;
  id: string;
  labels: Record<string, string>;
}

/**
 * Builds an annotation DataFrame for heatmap exemplar markers, matching the format
 * produced by exemplar/exemplar.go (PR #120995).
 *
 * Includes all label fields (series labels merged with per-exemplar labels) so the
 * heatmap tooltip shows the same context as the exemplar popover in the timeseries view.
 *
 * The heatmap panel picks up frames with `meta.dataTopic === 'annotations'` and
 * `frame.name === 'exemplar'` to render as diamond markers.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildExemplarDataFrame(response: SelectHeatmapResponse, unit: string): MutableDataFrame | null {
  const collected: CollectedExemplar[] = [];

  for (const series of response.series ?? []) {
    const seriesLabels: Record<string, string> = {};
    for (const label of series.labels ?? []) {
      seriesLabels[label.name] = label.value;
    }

    for (const slot of series.slots ?? []) {
      for (const exemplar of slot.exemplars ?? []) {
        const labels: Record<string, string> = { ...seriesLabels };
        for (const label of exemplar.labels ?? []) {
          labels[label.name] = label.value;
        }
        collected.push({
          timestamp: Number(exemplar.timestamp),
          value: Number(exemplar.value),
          id: exemplar.spanId || exemplar.profileId,
          labels,
        });
      }
    }
  }

  if (collected.length === 0) {
    return null;
  }

  // Collect all unique label names across all exemplars (sorted for consistency)
  const uniqLabelNames = new Set<string>();
  for (const e of collected) {
    for (const name of Object.keys(e.labels)) {
      uniqLabelNames.add(name);
    }
  }
  const sortedLabelNames = [...uniqLabelNames].sort();

  return new MutableDataFrame({
    name: 'exemplar',
    meta: { dataTopic: DataTopic.Annotations as any },
    fields: [
      { name: 'Time', type: FieldType.time, values: collected.map((e) => e.timestamp), config: {} },
      { name: 'Value', type: FieldType.number, values: collected.map((e) => e.value), config: { unit } },
      {
        name: 'Id',
        type: FieldType.string,
        values: collected.map((e) => e.id),
        config: { displayName: 'Span ID' },
      },
      ...sortedLabelNames.map((name: string) => ({
        name,
        type: FieldType.string,
        values: collected.map((e) => e.labels[name] ?? ''),
        config: {},
      })),
    ],
  });
}

/**
 * Collects all exemplars from a SelectHeatmap response, sorts by value descending,
 * and returns the top 50 rows for the exemplar table.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function extractExemplarRows(response: SelectHeatmapResponse): ExemplarRow[] {
  const rows: ExemplarRow[] = [];

  for (const series of response.series ?? []) {
    for (const slot of series.slots ?? []) {
      for (const exemplar of slot.exemplars ?? []) {
        if (!exemplar.spanId && !exemplar.profileId) {
          continue;
        }
        const labels: Record<string, string> = {};
        for (const label of series.labels ?? []) {
          labels[label.name] = label.value;
        }
        for (const label of exemplar.labels ?? []) {
          labels[label.name] = label.value;
        }
        rows.push({
          profileId: exemplar.profileId,
          timestamp: Number(exemplar.timestamp),
          value: Number(exemplar.value),
          spanId: exemplar.spanId || undefined,
          spanName: labels['span_name'] || labels['span.name'] || undefined,
        });
      }
    }
  }

  rows.sort((a, b) => b.value - a.value);
  return rows.slice(0, 50);
}
