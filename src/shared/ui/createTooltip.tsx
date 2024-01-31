import { TooltipCallbackProps } from '@pyroscope/components/TimelineChart/Tooltip.plugin';
import { TimelineTooltip } from '@pyroscope/components/TimelineTooltip';
import { Profile } from '@pyroscope/legacy/models';
import React from 'react';

import { prepareTimelineTooltipContent } from '../domain/prepareTimelineTooltipContent';

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
