import { TooltipCallbackProps } from '@pyroscope/components/TimelineChart/Tooltip.plugin';
import { TimelineTooltipProps } from '@pyroscope/components/TimelineTooltip';
import { getFormatter } from '@pyroscope/legacy/flamegraph/format/format';
import { Profile } from '@pyroscope/legacy/models';

// Converts data from TimelineChartWrapper into TimelineTooltip
export function prepareTimelineTooltipContent(
  profile: Profile,
  query: string,
  data: TooltipCallbackProps
): TimelineTooltipProps['items'] {
  const formatter = getFormatter(profile.flamebearer.numTicks, profile.metadata.sampleRate, profile.metadata.units);

  // Filter non empty values
  return (
    data.values
      .map((a) => {
        return {
          label: query,
          // TODO: horrible API
          value: a?.closest?.[1],
        };
      })
      // Sometimes closest is null
      .filter((a) => {
        return a.value;
      })
      .map((a) => {
        return {
          ...a,
          value: formatter.format(a.value, profile.metadata.sampleRate, true),
        };
      })
  );
}
