import { TimeRange } from '@grafana/data';
import { noOp } from '@shared/domain/noOp';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Timeline } from '@shared/types/Timeline';
import Color from 'color';
import React from 'react';

import { Selection } from './domain/markings';
import { useTimezone } from './domain/useTimeZone';
import { TimelineChartWrapper } from './TimelineChartWrapper';

type DoubleTimelineProps = {
  timeRange: TimeRange;
  onSelectTimeRange: (newTimeRange: TimeRange) => void;
  leftColor: Color;
  leftTimeline: Timeline;
  leftSelection: Selection;
  rightColor: Color;
  rightTimeline: Timeline;
  rightSelection: Selection;
};

export function DoubleTimeline({
  timeRange,
  onSelectTimeRange,
  leftColor,
  leftTimeline,
  leftSelection,
  rightColor,
  rightTimeline,
  rightSelection,
}: DoubleTimelineProps) {
  const timezone = useTimezone();

  const [query] = useQueryFromUrl();
  const { profileMetricId } = parseQuery(query);
  let unit = getProfileMetric(profileMetricId as ProfileMetricId).unit;

  if (!unit) {
    console.warn('Unit not found for profile type "%s"! Using "short" instead.', profileMetricId);
    unit = 'short';
  }

  const timelineA = {
    color: leftColor,
    data: leftTimeline,
    unit,
  };

  const timelineB = {
    color: rightColor,
    data: rightTimeline,
    unit,
  };

  const selection = {
    left: leftSelection,
    right: rightSelection,
  };

  // TODO: change ids
  return (
    <TimelineChartWrapper
      data-testid="timeline-single"
      id="timeline-chart-single"
      mode="singles"
      format="lines"
      timeRange={timeRange}
      timelineA={timelineA}
      timelineB={timelineB}
      timezone={timezone}
      selectionType="double"
      selection={selection}
      // TODO: FIXME
      onSelect={noOp}
      onSelectTimeRange={onSelectTimeRange}
    />
  );
}
