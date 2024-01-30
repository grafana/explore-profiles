import React from 'react';

import TimelineChartWrapper from '../../../overrides/components/TimelineChart/TimelineChartWrapper';
import { useColorMode } from '../domain/useColorMode';
import { useTimeZone } from '../domain/useTimeZone';

type TimelinePanelProps = {
  timeline: any; // TODO
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
