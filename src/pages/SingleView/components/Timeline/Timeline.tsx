import { TimeRange } from '@grafana/data';
import { noOp } from '@shared/domain/noOp';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Timeline as TimelineType } from '@shared/types/Timeline';
import React from 'react';

import { useTimezone } from './domain/useTimeZone';
import { TimelineChartWrapper } from './TimelineChartWrapper';

type TimelinePanelProps = {
  timeRange: TimeRange;
  timeline?: TimelineType;
  onSelectTimeRange: (newTimeRange: TimeRange) => void;
};

export function Timeline({ timeRange, timeline, onSelectTimeRange }: TimelinePanelProps) {
  const timezone = useTimezone();

  const [query] = useQueryFromUrl();
  const { profileMetricId } = parseQuery(query);
  let unit = getProfileMetric(profileMetricId as ProfileMetricId).unit;

  if (!unit) {
    console.warn('Unit not found for profile type "%s"! Using "short" instead.', profileMetricId);
    unit = 'short';
  }

  const timelineA = {
    data: timeline,
    unit,
  };

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
      // TODO: FIXME
      onSelect={noOp}
      onSelectTimeRange={onSelectTimeRange}
    />
  );
}