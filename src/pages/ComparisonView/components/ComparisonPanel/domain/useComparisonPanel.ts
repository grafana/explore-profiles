import { TimeRange } from '@grafana/data';
import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/timeline-profile/useFetchTimelineAndProfile';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { convertAbsoluteToRelativeTimeRange } from '../../../domain/convertAbsoluteToRelativeTimeRange';
import { convertRelativeToAbsoluteTimeRange } from '../../../domain/convertRelativeToAbsoluteTimeRange';
import { getRelativeUnitForSync } from '../../../domain/getRelativeUnitForSync';
import { isRelativeTimeRange } from '../../../domain/isRelativeTimeRange';
import { GRAY_TIMELINE_SELECTION_COLORS } from '../../../ui/colors';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function useComparisonPanel(isBaselinePanel: boolean): DomainHookReturnValue {
  const [mainTimeRange] = useTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  const {
    query,
    setQuery,
    timeRange: selectedTimeRange,
    setTimeRange: selectTimeRange,
  } = useLeftRightParamsFromUrl()[isBaselinePanel ? 'left' : 'right'];

  const {
    isFetching: isFetchingTimeline,
    error: fetchTimelineDataError,
    timeline,
    profile: profileFromTimelineFetch,
  } = useFetchTimelineAndProfile({
    target: isBaselinePanel ? 'left-timeline' : 'right-timeline',
    query,
    timeRange: mainTimeRange,
    maxNodes,
  });

  return {
    data: {
      isLoading: isFetchingTimeline,
      fetchTimelineDataError,
      // TODO: improve
      noTimelineDataAvailable: !fetchTimelineDataError && profileFromTimelineFetch?.flamebearer.numTicks === 0,
      mainTimeRange,
      query,
      timeline,
      timelineSelection: {
        from: selectedTimeRange.from.unix(),
        to: selectedTimeRange.to.unix(),
        color: GRAY_TIMELINE_SELECTION_COLORS.COLOR,
        overlayColor: GRAY_TIMELINE_SELECTION_COLORS.OVERLAY,
      },
      selectionOutOfRange:
        selectedTimeRange.to.unix() < mainTimeRange.from.unix() ||
        selectedTimeRange.from.unix() > mainTimeRange.to.unix(),
    },
    actions: {
      setQuery,
      selectTimeRange(newSelection: TimeRange) {
        if (isRelativeTimeRange(mainTimeRange) && !isRelativeTimeRange(newSelection)) {
          selectTimeRange(convertAbsoluteToRelativeTimeRange(newSelection, getRelativeUnitForSync(mainTimeRange)));
          return;
        }

        if (!isRelativeTimeRange(mainTimeRange) && isRelativeTimeRange(newSelection)) {
          selectTimeRange(convertRelativeToAbsoluteTimeRange(newSelection));
          return;
        }

        selectTimeRange(newSelection);
      },
    },
  };
}
