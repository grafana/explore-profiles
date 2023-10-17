import React, { useContext, useEffect, useRef, useState } from 'react';
import Color from 'color';
import { markingsFromSelection } from '@pyroscope/components/TimelineChart/markings';
import { PanelRenderer } from '@grafana/runtime';
import {
  AbsoluteTimeRange,
  DataFrame,
  FieldColorModeId,
  FieldType,
  MutableDataFrame,
  PanelData,
  TimeRange,
  rangeUtil,
} from '@grafana/data';
import { LoadingState } from '@grafana/schema';
import { translateGrafanaAbsoluteTimeRangeToPyroscope } from '../../../../utils/translation';
import { usePanelContext, useTheme2 } from '@grafana/ui';
import { PyroscopeStateContext } from '../../../../components/PyroscopeState/context';

import PyroscopeTimelineChartWrapper from 'grafana-pyroscope/public/app/components/TimelineChart/TimelineChartWrapper';
import { TimelineData } from 'grafana-pyroscope/public/app/components/TimelineChart/centerTimelineData';

type TimelineChartWrapperProps = ConstructorParameters<typeof PyroscopeTimelineChartWrapper>[0];

type Marking = {
  xaxis: { from: number; to: number };
  color: Color;
  lineWidth?: number;
};

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
        : stringifyColor(marking.color) || theme.colors.text.secondary;
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

  // Adjust visible range to match actual data if there is any.
  let rangeFrom = series[0]?.fields[0].values.at(0)
  let rangeTo = series[0]?.fields[0].values.at(-1)

  for (let i = 1; i  < series.length; ++i) {
    rangeFrom = Math.min(rangeFrom, series[i].fields[0].values.at(0))
    rangeTo = Math.max(rangeTo, series[i].fields[0].values.at(-1));
  }

  // If there is real data, use that to determine the range. Otherwise use what is set in the context.
  const practicalRange = (rangeFrom && rangeTo) ? rangeUtil.convertRawToRange({from: rangeFrom, to: rangeTo}) : timeRange;


  return (
    <GrafanaTimeSeries
      series={series}
      showLegend={showLegend}
      annotations={annotations}
      onChangeTimeRange={onChangeTimeRange}
      timeRange={practicalRange}
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

  useEffect(() => {
    if (panelContainer.current) {
      setWidth(panelContainer.current.offsetWidth);
    }
  }, [panelContainer]);

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
    <div style={{ minWidth: '100%' }} ref={panelContainer}>
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
  const custom = format === 'bars' ? { drawStyle: 'bars', fillOpacity: 100 } : { drawStyle: 'lines' };

  const dataframe = new MutableDataFrame();
  dataframe.addField({ name: 'time', type: FieldType.time });
  // If there is no color, leave it as undefined so the default can be chosen
  const color = data?.color ? { mode: FieldColorModeId.Fixed, fixedColor: stringifyColor(data?.color) } : undefined;
  dataframe.addField({ name: label || ' ', type: FieldType.number, config: { unit, custom, color } });

  const timeline = data.data;

  if (!timeline) {
    return dataframe;
  }

  const { durationDelta, samples, startTime } = timeline;

  for (let i = 0; i < samples.length; ++i) {
    const time = (startTime + i * durationDelta) * 1000;
    const sample = samples[i];

    dataframe.appendRow([time, sample]);
  }

  return dataframe;
}

function stringifyColor(color: string | undefined | Color) {
  if (typeof color === 'string' || color === undefined) {
    return color;
  }
  return color.toString();
}

export default TimelineChartWrapper;
