import {
  AbsoluteTimeRange,
  DataFrame,
  dateTime,
  FieldColorModeId,
  FieldType,
  MutableDataFrame,
  PanelData,
  rangeUtil,
  TimeRange,
} from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { LoadingState } from '@grafana/schema';
import { usePanelContext, useTheme2 } from '@grafana/ui';
import { markingsFromSelection } from '@pyroscope/components/TimelineChart/markings';
import useResizeObserver from '@react-hook/resize-observer';
import Color from 'color';
import { TimelineData } from 'grafana-pyroscope/public/app/components/TimelineChart/centerTimelineData';
import PyroscopeTimelineChartWrapper from 'grafana-pyroscope/public/app/components/TimelineChart/TimelineChartWrapper';
import React, { useContext, useRef, useState } from 'react';

import { PyroscopeStateContext } from '../../../../app/domain/PyroscopeState/context';
import {
  ceilTenSeconds,
  floorTenSeconds,
  stringifyPyroscopeColor,
  translateGrafanaAbsoluteTimeRangeToPyroscope,
} from '../../../../shared/domain/translation';

const POINT_DISTANCE = 10000; // At this time, all points are 10 seconds apart.

type TimelineChartWrapperProps = ConstructorParameters<typeof PyroscopeTimelineChartWrapper>[0];

type Marking = {
  xaxis: { from: number; to: number };
  color: Color;
  lineWidth?: number;
};

// TODO: Refactor this function to reduce its Cognitive Complexity from 9 to a value we feel confident with :)
// eslint-disable-next-line sonarjs/cognitive-complexity
function TimelineChartWrapper(props: TimelineChartWrapperProps) {
  const theme = useTheme2();

  const { timeRange } = useContext(PyroscopeStateContext);

  const unit = useSelectedProfileUnit();

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

  const timelines: TimelineData[] = [];

  let format = props.format;

  if (props.mode === 'multiple') {
    const { activeGroup, timelineGroups } = props;

    // for props.id, the case 'timeline-chart-explore-page' has a 1:1 relationship with the props.mode === 'multiple' case
    // So we will append the labels from the timeline groups.
    timelineGroups.forEach((group) => dataLabels.push(group.tagName));

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

  const series = timelines.map((timeline, index) => convertToDataFrame(timeline, unit, format, dataLabels[index]));

  const annotations: DataFrame[] = [];

  const subSelections = new RangeAnnotation();

  const selectionMarkings = markingsFromSelection(props.selectionType, props.selection?.left, props.selection?.right);
  selectionMarkings.forEach((marking: Marking) => {
    const color =
      marking.color.alpha() === 0
        ? theme.colors.text.secondary
        : stringifyPyroscopeColor(marking.color) || theme.colors.text.secondary;
    subSelections.addRange({ time: marking.xaxis.from as number, timeEnd: marking.xaxis.to as number, color });
  });

  if (subSelections.length > 0) {
    annotations.push(subSelections);
  }

  const showLegend = dataLabels.length >= 2;

  const onChangeTimeRange = (timeRange: AbsoluteTimeRange) => {
    const { from, until } = translateGrafanaAbsoluteTimeRangeToPyroscope(timeRange);
    props.onSelect(from, until);
  };

  const adjustedRange = rangeUtil.convertRawToRange({
    from: dateTime(floorTenSeconds(timeRange.from.unix() * 1000) - POINT_DISTANCE / 2),
    to: dateTime(ceilTenSeconds(timeRange.to.unix() * 1000)),
  });

  return (
    <GrafanaTimeSeries
      series={series}
      showLegend={showLegend}
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
  }
  addRange(entry: { time: number; timeEnd: number; color?: string }) {
    this.add({ ...entry, isRegion: true });
  }
}

function useSelectedProfileUnit() {
  const stateContext = useContext(PyroscopeStateContext);
  const unit = stateContext?.selectedProfileType?.split(':')[2];

  if (unit == null) {
    return 'number';
  }

  return unitMap[unit] || unit;
}

// TODO When https://github.com/grafana/pyroscope-app-plugin/pull/115 is merged, use that central map to determine the units instead.
const unitMap: Record<string, string> = {
  nanoseconds: 'ns',
  count: 'short',
};

export function convertToDataFrame(data: TimelineData, unit: string, format: 'bars' | 'lines', label?: string) {
  const custom = format === 'bars' ? { drawStyle: 'bars', fillOpacity: 100, barAlignment: 1 } : { drawStyle: 'lines' };

  const dataframe = new MutableDataFrame();
  dataframe.addField({ name: 'time', type: FieldType.time });
  // If there is no color, leave it as undefined so the default can be chosen
  const color = data?.color
    ? { mode: FieldColorModeId.Fixed, fixedColor: stringifyPyroscopeColor(data?.color) }
    : undefined;
  dataframe.addField({ name: label || ' ', type: FieldType.number, config: { unit, custom, color } });

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

export default TimelineChartWrapper;
