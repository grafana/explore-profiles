import { css } from '@emotion/css';
import { DataLinkClickEvent, Field, LoadingState, MutableDataFrame } from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataNode,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { TooltipDisplayMode } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import React, { useCallback, useEffect, useRef } from 'react';

import { SceneExploreServiceHeatmap } from './SceneExploreServiceHeatmap';

interface SelectedExemplar {
  timestamp: number; // ms
  value: number;
}

interface SceneHeatmapState extends SceneObjectState {
  body: VizPanel;
  selectedExemplar?: SelectedExemplar;
  yMin: number;
  yMax: number;
  yBucketSize: number;
}

const EXEMPLAR_COLOR_DEFAULT = 'rgba(31, 120, 193, 0.7)';
const EXEMPLAR_HIGHLIGHT_COLOR = 'rgba(255, 152, 0, 1)';
const MARKER_SIZE = 8; // px — matches the heatmap panel's exemplar diamond size

export class SceneHeatmap extends SceneObjectBase<SceneHeatmapState> {
  constructor({ embedded = false }: { embedded?: boolean } = {}) {
    super({
      key: 'scene-heatmap',
      body: SceneHeatmap.buildPanel(embedded),
      selectedExemplar: undefined,
      yMin: 0,
      yMax: 1,
      yBucketSize: 0,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private static buildPanel(embedded = false): VizPanel {
    let builder = PanelBuilders.heatmap()
      .setTitle('Span Profile Heatmap')
      .setOption('calculate', false)
      .setOption('cellGap', 1)
      .setOption('color', { scheme: 'Spectral', steps: 64 })
      .setOption('tooltip', { mode: TooltipDisplayMode.Single, yHistogram: true, showColorScale: true })
      .setOption('exemplars', { color: EXEMPLAR_COLOR_DEFAULT })
      .setData(new SceneDataNode());

    if (embedded) {
      builder = builder.setHoverHeader(true);
    }

    return builder.build();
  }

  onActivate() {
    let parent: SceneExploreServiceHeatmap | undefined;
    try {
      parent = sceneGraph.getAncestor(this, SceneExploreServiceHeatmap);
    } catch {
      return;
    }

    const parentSub = parent.subscribeToState((newState, prevState) => {
      if (
        newState.heatmapFrame !== prevState.heatmapFrame ||
        newState.exemplarFrame !== prevState.exemplarFrame ||
        newState.isLoading !== prevState.isLoading ||
        newState.selectedSpanId !== prevState.selectedSpanId ||
        newState.selectedTimestamp !== prevState.selectedTimestamp
      ) {
        this.updateData(
          newState.heatmapFrame,
          newState.exemplarFrame,
          newState.isLoading,
          newState.selectedSpanId,
          newState.selectedTimestamp,
          parent!
        );
      }
    });

    this.updateData(
      parent.state.heatmapFrame,
      parent.state.exemplarFrame,
      parent.state.isLoading,
      parent.state.selectedSpanId,
      parent.state.selectedTimestamp,
      parent
    );

    return () => parentSub.unsubscribe();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private updateData(
    frame: MutableDataFrame | undefined,
    exemplarFrame: MutableDataFrame | undefined,
    isLoading: boolean,
    selectedSpanId: string | undefined,
    selectedTimestamp: number | undefined,
    parent: SceneExploreServiceHeatmap
  ) {
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const annotations: MutableDataFrame[] = [];
    let selectedExemplar: SelectedExemplar | undefined;

    // Compute y extent from the heatmap frame for overlay positioning
    let yMin = 0;
    let yMax = 1;
    let yBucketSize = 0;
    if (frame) {
      const yMinField = frame.fields.find((f) => f.name === 'yMin');
      if (yMinField) {
        const vals: number[] = yMinField.values.toArray();
        yMin = Math.min(...vals);
        yBucketSize = (frame.meta?.custom as any)?.yBucketSize ?? 0;
        yMax = Math.max(...vals) + yBucketSize;
      }
    }

    if (exemplarFrame) {
      const idField = exemplarFrame.fields.find((f) => f.name === 'Id');
      const timeField = exemplarFrame.fields.find((f) => f.name === 'Time');
      const valueField = exemplarFrame.fields.find((f) => f.name === 'Value');

      if (idField) {
        idField.config = {
          ...idField.config,
          links: [
            {
              title: t('heatmap.exemplar.select', 'Select exemplar'),
              url: '',
              onClick: (event: DataLinkClickEvent) => {
                const spanId = getDataLinkString(event, [
                  '${__value.raw}',
                  '${__data.fields.Id}',
                  '${__data.fields[Id]}',
                  '${__data.fields["Id"]}',
                  '${__data.fields[2]}',
                ]);
                if (!spanId) {
                  return;
                }

                // The interpolated Time string is lossy (formatted, truncated to
                // seconds, parsed as local time), so we use it only to disambiguate
                // duplicate span ids, then snap to the exact raw Time value from the
                // frame. Matching the exact frame value is required for the selected
                // exemplar lookup (and the table row highlight) to succeed.
                const approxTimestamp = getDataLinkTimestamp(event);
                const timestamp = resolveExemplarTimestamp(idField, timeField, spanId, approxTimestamp);

                const isSelected =
                  spanId === parent.state.selectedSpanId && timestamp === parent.state.selectedTimestamp;
                parent.setState({
                  selectedSpanId: isSelected ? undefined : spanId,
                  selectedProfileId: undefined,
                  selectedTimestamp: isSelected ? undefined : timestamp,
                });
              },
            },
          ],
        };
      }

      if (selectedSpanId && idField && timeField && valueField) {
        const ids = idField.values.toArray();
        const timestamps = timeField.values.toArray();
        const idx = ids.findIndex((id, index) => {
          return id === selectedSpanId && (selectedTimestamp === undefined || timestamps[index] === selectedTimestamp);
        });
        if (idx >= 0) {
          selectedExemplar = {
            timestamp: timeField.values.get(idx),
            value: valueField.values.get(idx),
          };
        }
      }

      annotations.push(exemplarFrame);
    }

    this.setState({ selectedExemplar, yMin, yMax, yBucketSize });

    (this.state.body.state.$data as SceneDataNode).setState({
      data: {
        state: isLoading ? LoadingState.Loading : LoadingState.Done,
        series: frame ? [frame] : [],
        annotations,
        timeRange,
      },
    });
  }

  static Component({ model }: SceneComponentProps<SceneHeatmap>) {
    const { body, selectedExemplar, yMin, yMax, yBucketSize } = model.useState();
    const timeRange = sceneGraph.getTimeRange(model).useState().value;
    const styles = useStyles2(getStyles);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const drawOverlay = useCallback(() => {
      const overlay = overlayRef.current;
      const wrapper = wrapperRef.current;
      if (!overlay || !wrapper) {
        return;
      }

      const ctx = overlay.getContext('2d');
      if (!ctx) {
        return;
      }

      // The canvas is the only canvas in our wrapper (the heatmap panel renders
      // directly without a .uplot wrapper div in this Scenes context).
      const panelCanvas = wrapper.querySelector<HTMLCanvasElement>('canvas');
      if (!panelCanvas) {
        return;
      }

      // Size the overlay to exactly cover the panel canvas
      const rect = panelCanvas.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      overlay.style.left = `${rect.left - wrapRect.left}px`;
      overlay.style.top = `${rect.top - wrapRect.top}px`;
      overlay.width = panelCanvas.width;
      overlay.height = panelCanvas.height;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (!selectedExemplar) {
        return;
      }

      // Compute pixel position using the time range (x) and frame y extent.
      // We get xMin/xMax from the Scenes time range and yMin/yMax from the
      // heatmap frame stored in parent state. The heatmap panel uses a linear
      // scale for both axes (we confirmed the data is linearly spaced).
      const dpr = window.devicePixelRatio || 1;
      const xMin = timeRange.from.valueOf();
      const xMax = timeRange.to.valueOf();

      // Read the actual plot area from the .u-over div (the uPlot cursor overlay
      // which covers exactly the data area, excluding axis margins).
      const canvasRect = panelCanvas.getBoundingClientRect();
      const uOver = wrapper.querySelector('.u-over');
      let plotLeft: number, plotTop: number, plotW: number, plotH: number;

      if (uOver) {
        const overRect = uOver.getBoundingClientRect();
        // Convert from page coords to canvas pixel coords (accounting for dpr)
        const scaleX = panelCanvas.width / canvasRect.width;
        const scaleY = panelCanvas.height / canvasRect.height;
        plotLeft = (overRect.left - canvasRect.left) * scaleX;
        plotTop = (overRect.top - canvasRect.top) * scaleY;
        plotW = overRect.width * scaleX;
        plotH = overRect.height * scaleY;
      } else {
        // Fallback: hardcoded estimates
        plotLeft = 55 * dpr;
        plotTop = 10 * dpr;
        plotW = panelCanvas.width - plotLeft;
        plotH = panelCanvas.height - 30 * dpr - plotTop;
      }

      const xFrac = (selectedExemplar.timestamp - xMin) / (xMax - xMin);
      // Grafana's heatmap y scale extends by half a bucket on each end to visually
      // centre the bucket cells, so we match that range for accurate overlay placement.
      const halfBucket = yBucketSize / 2;
      const yExtMin = yMin - halfBucket;
      const yExtRange = yMax - yMin + yBucketSize;
      const yFrac = yExtRange > 0 ? (selectedExemplar.value - yExtMin) / yExtRange : 0;
      const xPx = plotLeft + xFrac * plotW;
      const yPx = plotTop + (1 - yFrac) * plotH + MARKER_SIZE * dpr;

      if (isNaN(xPx) || isNaN(yPx)) {
        return;
      }

      const size = MARKER_SIZE * dpr;

      ctx.save();
      ctx.strokeStyle = EXEMPLAR_HIGHLIGHT_COLOR;
      ctx.lineWidth = 2 * dpr;
      ctx.shadowColor = EXEMPLAR_HIGHLIGHT_COLOR;
      ctx.shadowBlur = 4 * dpr;

      // Draw a diamond outline matching the exemplar marker shape
      ctx.beginPath();
      ctx.moveTo(xPx, yPx - size);
      ctx.lineTo(xPx + size, yPx);
      ctx.lineTo(xPx, yPx + size);
      ctx.lineTo(xPx - size, yPx);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }, [selectedExemplar, yMin, yMax, yBucketSize, timeRange]);

    useEffect(() => {
      drawOverlay();

      // Defer redraws via rAF so uPlot finishes its own resize before we measure.
      // Multiple resize events in the same frame are coalesced (cancelAnimationFrame).
      let rafId = 0;
      const scheduleRedraw = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(drawOverlay);
      };

      const ro = new ResizeObserver(scheduleRedraw);
      if (wrapperRef.current) {
        ro.observe(wrapperRef.current);
      }
      window.addEventListener('resize', scheduleRedraw);

      return () => {
        ro.disconnect();
        window.removeEventListener('resize', scheduleRedraw);
        cancelAnimationFrame(rafId);
      };
    }, [drawOverlay]);

    return (
      <div ref={wrapperRef} className={styles.wrapper}>
        <body.Component model={body} />
        <canvas ref={overlayRef} className={styles.overlay} />
      </div>
    );
  }
}

function getDataLinkString(event: DataLinkClickEvent, variableNames: string[]): string | undefined {
  for (const variableName of variableNames) {
    const value = event.replaceVariables?.(variableName);

    if (value && value !== variableName) {
      return value;
    }
  }

  return undefined;
}

/**
 * Resolves the exact exemplar timestamp from the frame for a clicked span id.
 *
 * The data link click only yields a lossy timestamp (the interpolated Time string
 * is formatted, truncated to seconds, and parsed as local time), which never
 * strictly equals the raw frame Time value used for the selected-exemplar lookup.
 * We therefore look up the matching frame row(s) by span id and return the raw
 * Time value, using the lossy timestamp only to disambiguate duplicate span ids.
 */
function resolveExemplarTimestamp(
  idField: Field | undefined,
  timeField: Field | undefined,
  spanId: string,
  approxTimestamp: number | undefined
): number | undefined {
  if (!idField || !timeField) {
    return approxTimestamp;
  }

  const ids = idField.values.toArray();
  const times = timeField.values.toArray();

  const candidates: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === spanId) {
      candidates.push(times[i]);
    }
  }

  if (candidates.length === 0) {
    return approxTimestamp;
  }

  if (candidates.length === 1 || approxTimestamp === undefined) {
    return candidates[0];
  }

  // Disambiguate duplicates: pick the raw frame time nearest the lossy click time.
  return candidates.reduce(
    (best, t) => (Math.abs(t - approxTimestamp) < Math.abs(best - approxTimestamp) ? t : best),
    candidates[0]
  );
}

function getDataLinkTimestamp(event: DataLinkClickEvent): number | undefined {
  const value = getDataLinkString(event, [
    '${__data.fields.Time}',
    '${__data.fields[Time]}',
    '${__data.fields["Time"]}',
    '${__data.fields[0]}',
  ]);

  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parsedValue = Date.parse(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

const getStyles = () => ({
  wrapper: css`
    position: relative;
    width: 100%;
    height: 100%;
  `,
  overlay: css`
    position: absolute;
    pointer-events: none;
  `,
});
