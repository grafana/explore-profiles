import React from 'react';

// TODO: migrate TimelineChartWrapper
import TimelineChartWrapper from '../../../overrides/components/TimelineChart/TimelineChartWrapper';
import { Timeline as TimelineType } from '../../../shared/types/Timeline';
import { useColorMode } from '../../../shared/ui/useColorMode';
import { useTimeZone } from '../domain/useTimeZone';

type TimelinePanelProps = {
  timeline: TimelineType;
  onSelectTimeRange: (from: string, until: string) => void;
};

export function Timeline({ timeline, onSelectTimeRange }: TimelinePanelProps) {
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
      timelineA={timelineA}
      timezone={timezone}
      selectionType="single"
      onSelect={onSelectTimeRange}
    />
  );
}
