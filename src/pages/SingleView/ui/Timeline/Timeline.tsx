import { TimeRange } from '@grafana/data';
import { noOp } from '@shared/domain/noOp';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Timeline as TimelineType } from '@shared/types/Timeline';
import { useColorMode } from '@shared/ui/useColorMode';
import React from 'react';

import { useTimeZone } from './domain/useTimeZone';
import { TimelineChartWrapper } from './TimelineChartWrapper';

type TimelinePanelProps = {
  timeRange: TimeRange;
  timeline: TimelineType;
  onSelectTimeRange: (newTimeRange: TimeRange) => void;
};

export function Timeline({ timeRange, timeline, onSelectTimeRange }: TimelinePanelProps) {
  const { offset } = useTimeZone();
  const timezone = offset === 0 ? 'utc' : 'browser';
  const { colorMode } = useColorMode();

  const [query] = useQueryFromUrl();
  const { profileType } = parseQuery(query);
  let unit = getProfileMetric(profileType as ProfileMetricId)?.unit;

  if (!unit) {
    console.warn('Unit not found for profile type "%s"! Using "short" instead.', profileType);
    unit = 'short';
  }

  const timelineA = {
    data: timeline,
    color: colorMode === 'light' ? '#3b78e7' : undefined,
    unit,
  };

  return (
    <TimelineChartWrapper
      data-testid="timeline-single"
      id="timeline-chart-single"
      height="125px"
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
