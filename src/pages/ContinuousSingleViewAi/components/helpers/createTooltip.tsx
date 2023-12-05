import React from 'react';
import { TooltipCallbackProps } from '@pyroscope/components/TimelineChart/Tooltip.plugin';
import { Profile } from '@pyroscope/legacy/models';
import { TimelineTooltip } from '@pyroscope/components/TimelineTooltip';
import { prepareTimelineTooltipContent } from './prepareTimelineTooltipContent';

export function createTooltip(query: string, data: TooltipCallbackProps, profile?: Profile) {
  if (!profile) {
    return null;
  }

  const values = prepareTimelineTooltipContent(profile, query, data);

  if (values.length <= 0) {
    return null;
  }

  return <TimelineTooltip timeLabel={data.timeLabel} items={values} />;
}
