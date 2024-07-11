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

type SingleTimelineProps = {
  timeRange: TimeRange;
  onSelectTimeRange: (newTimeRange: TimeRange) => void;
  color?: Color;
  timeline?: Timeline;
  selection?: Selection;
};

export function SingleTimeline({ timeRange, onSelectTimeRange, color, timeline, selection }: SingleTimelineProps) {
  const timezone = useTimezone();

  const [query] = useQueryFromUrl();
  const { profileMetricId } = parseQuery(query);
  let unit = getProfileMetric(profileMetricId as ProfileMetricId).unit;

  if (!unit) {
    console.warn('Unit not found for profile type "%s"! Using "short" instead.', profileMetricId);
    unit = 'short';
  }

  const timelineA = {
    color,
    data: timeline,
    unit,
  };

  const wrapperSelection = { right: selection };

  return (
    <TimelineChartWrapper
      data-testid="timeline-single"
      id="timeline-chart-single"
      mode="singles"
      format="bars"
      timeRange={timeRange}
      timelineA={timelineA}
      timezone={timezone}
      selectionType="single"
      selection={wrapperSelection}
      onSelect={noOp}
      onSelectTimeRange={onSelectTimeRange}
    />
  );
}
