import {
  AbsoluteTimeRange,
  DataFrame,
  dateTime,
  FieldColorModeId,
  FieldType,
  LoadingState,
  MutableDataFrame,
  PanelData,
  rangeUtil,
  TimeRange,
} from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { usePanelContext, useTheme2 } from '@grafana/ui';
import useResizeObserver from '@react-hook/resize-observer';
import {
  ceilTenSeconds,
  floorTenSeconds,
  stringifyPyroscopeColor,
  translateGrafanaAbsoluteTimeRangeToPyroscope,
  translatePyroscopeTimeRangeToGrafana,
} from '@shared/domain/translation';
import { Timeline } from '@shared/types/Timeline';
import Color from 'color';
import React, { useRef, useState } from 'react';

import { markingsFromSelection } from './markings';
import { TimelineChartWrapperProps } from './types';

const POINT_DISTANCE = 10000; // At this time, all points are 10 seconds apart.

type Marking = {
  xaxis: { from: number; to: number };
  color: Color;
  lineWidth?: number;
};

// TODO: Refactor this function to reduce its Cognitive Complexity from 9 to a value we feel confident with :)
// eslint-disable-next-line sonarjs/cognitive-complexity
export function TimelineChartWrapper(props: TimelineChartWrapperProps) {
  const theme = useTheme2();

  const timelines: TimelineData[] = [];

  let format = props.format;

  if (props.mode === 'multiple') {
    const { activeGroup, timelineGroups } = props;

    // Here we fade the colours for non-activeGroup timelines (if one is selected), as is done in pyroscope
    timelineGroups
      .map((timeline) => {
        return {
          ...timeline,
          color: activeGroup && activeGroup !== timeline.tagName ? timeline.color?.fade(0.75) : timeline.color,
        };
      })
      .forEach((timeline) => timelines.push(timeline as TimelineData));
  } else {
    const { timelineA, timelineB } = props;
    // As in pyroscope, we override to bars when only one
    format = timelineA && timelineB ? 'lines' : 'bars';

    [timelineA, timelineB].forEach((timeline) => timeline && timelines.push(timeline));
  }

  const series = timelines.map((timeline) => convertToDataFrame(timeline, format));

  const annotations: DataFrame[] = [];

  const subSelections = new RangeAnnotation();

  const selectionMarkings = markingsFromSelection(props.selectionType, props.selection?.left, props.selection?.right);

  const dataLabels = (() => {
    // These only handle the props.mode === 'singles' case
    switch (props.id) {
      case 'timeline-chart-diff':
      case 'timeline-chart-double':
        return ['Baseline', 'Comparison'];
      case 'timeline-chart-left':
        return ['Baseline'];
      case 'timeline-chart-right':
        return ['Comparison'];
      case 'timeline-chart-single':
        return [' ']; // Shows a blank entry when hovering over items
    }
    return [];
  })();

  // Set up annotation texts
  const texts: string[] = [];
  if (props.selectionType === 'single') {
    // Only one if visible, we need to find out which one via `dataLabels`
    const type = dataLabels[0];
    texts[0] = `${type} range`;
    texts[1] = `${type} start`;
    texts[2] = `${type} end`;
  } else {
    // Both are available
    texts[0] = `Baseline range`;
    texts[1] = `Baseline start`;
    texts[2] = `Baseline end`;
    texts[3] = `Comparison range`;
    texts[4] = `Comparison start`;
    texts[5] = `Comparison end`;
  }

  selectionMarkings.forEach((marking: Marking, index) => {
    const color =
      marking.color.alpha() === 0
        ? theme.colors.text.secondary
        : stringifyPyroscopeColor(marking.color) || theme.colors.text.secondary;

    subSelections.addRange({
      time: marking.xaxis.from as number,
      timeEnd: marking.xaxis.to as number,
      color,
      text: texts[index],
    });
  });

  if (subSelections.length > 0) {
    annotations.push(subSelections);
  }

  const onChangeTimeRange = (timeRange: AbsoluteTimeRange) => {
    // TODO: FIXME - it should be straighforward
    const { from, until } = translateGrafanaAbsoluteTimeRangeToPyroscope(timeRange);
    const grafanaTimeRange = translatePyroscopeTimeRangeToGrafana(from, until);
    props.onSelectTimeRange(grafanaTimeRange);
  };

  const adjustedRange = rangeUtil.convertRawToRange({
    from: dateTime(floorTenSeconds(props.timeRange.from.unix() * 1000) - POINT_DISTANCE / 2),
    to: dateTime(ceilTenSeconds(props.timeRange.to.unix() * 1000)),
  });

  return (
    <GrafanaTimeSeries
      series={series}
      showLegend={false}
      annotations={annotations}
      onChangeTimeRange={onChangeTimeRange}
      timeRange={adjustedRange}
    />
  );
}

function GrafanaTimeSeries({
  series,
  annotations,
  showLegend,
  onChangeTimeRange,
  timeRange,
}: {
  series: DataFrame[];
  annotations: DataFrame[];
  showLegend: boolean;
  onChangeTimeRange: (timeRange: AbsoluteTimeRange) => void;
  timeRange: TimeRange;
}) {
  const panelContainer = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useResizeObserver(panelContainer, (entry: ResizeObserverEntry) => {
    setWidth(entry.contentRect.width);
  });

  const panelData: PanelData = {
    series,
    state: LoadingState.Done,
    timeRange,
    annotations,
  };

  // This hack modifies the local panel context to prevent calling `canEdit/canAdd` methods which aren't defined by default.
  const ctx = usePanelContext();
  const nope = () => false;
  ctx.canEditAnnotations = nope;
  ctx.canDeleteAnnotations = nope;

  return (
    <div style={{ minWidth: '100%', overflow: 'hidden' }} ref={panelContainer}>
      <PanelRenderer
        title={''}
        pluginId="timeseries"
        onOptionsChange={() => void 0}
        onChangeTimeRange={onChangeTimeRange}
        width={width}
        height={200}
        data={panelData}
        options={{ legend: { showLegend }, tooltip: { mode: 'multi' } }}
      />
    </div>
  );
}

class RangeAnnotation extends MutableDataFrame {
  constructor() {
    super();
    this.addField({
      name: 'time',
      type: FieldType.time,
    });
    this.addField({
      name: 'timeEnd',
      type: FieldType.time,
    });
    this.addField({
      name: 'isRegion',
      type: FieldType.boolean,
    });
    this.addField({
      name: 'color',
      type: FieldType.other,
    });
    this.addField({
      name: 'text',
      type: FieldType.string,
    });
  }
  addRange(entry: { time: number; timeEnd: number; color?: string; text: string }) {
    this.add({ ...entry, isRegion: true });
  }
}

type TimelineData = {
  data?: Timeline;
  color?: string;
  unit?: string;
};

export function convertToDataFrame(data: TimelineData, format: 'bars' | 'lines', label?: string) {
  const custom = format === 'bars' ? { drawStyle: 'bars', fillOpacity: 100, barAlignment: 1 } : { drawStyle: 'lines' };

  const dataframe = new MutableDataFrame();
  dataframe.addField({ name: 'time', type: FieldType.time });
  // If there is no color, leave it as undefined so the default can be chosen
  const color = data?.color
    ? { mode: FieldColorModeId.Fixed, fixedColor: stringifyPyroscopeColor(data?.color) }
    : undefined;
  dataframe.addField({ name: label || ' ', type: FieldType.number, config: { unit: data.unit, custom, color } });

  const timeline = data.data;

  if (!timeline) {
    return dataframe;
  }

  const { durationDelta, samples, startTime } = timeline;

  // Prevents processing a timeline with undefined, null, or NaN time entries.
  if (Number.isNaN(Number(startTime)) || Number.isNaN(Number(durationDelta))) {
    console.error('The start time or duration delta is not defined. Ignoring timeline.', {
      startTime,
      durationDelta,
      label,
    });
    return dataframe;
  }

  for (let i = 0; i < samples.length; ++i) {
    const time = (startTime + i * durationDelta) * 1000; // Scale to milliseconds
    const sample = samples[i];

    dataframe.appendRow([time, sample]);
  }

  return dataframe;
}
