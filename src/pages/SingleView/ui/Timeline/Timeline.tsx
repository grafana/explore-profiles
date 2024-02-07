import { Timeline as TimelineType } from '@shared/types/Timeline';
import { TimeRange } from '@shared/types/TimeRange';
import { useColorMode } from '@shared/ui/useColorMode';
import React from 'react';

import { useTimeZone } from '../../domain/useTimeZone';
import { TimelineChartWrapper } from './TimelineChartWrapper';

type TimelinePanelProps = {
  timeRange: TimeRange;
  timeline: TimelineType;
  onSelectTimeRange: (from: string, until: string) => void;
};

export function Timeline({ timeRange, timeline, onSelectTimeRange }: TimelinePanelProps) {
  const { offset } = useTimeZone();
  const timezone = offset === 0 ? 'utc' : 'browser';

  const { colorMode } = useColorMode();
  const timelineA = {
    data: timeline,
    color: colorMode === 'light' ? '#3b78e7' : undefined,
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
      onSelect={onSelectTimeRange}
    />
  );
}
