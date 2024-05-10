import { TimeRange } from '@grafana/data';
import { useLeftRightParamsFromUrl } from '@shared/domain/url-params/useLeftRightParamsFromUrl';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/useFetchTimelineAndProfile';
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

  const {
    isFetching: isFetchingProfile,
    error: fetchProfileDataError,
    profile,
  } = useFetchTimelineAndProfile({
    target: isBaselinePanel ? 'left-profile' : 'right-profile',
    query,
    timeRange: selectedTimeRange,
    maxNodes,
  });

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  // TODO: improve
  const noTimelineDataAvailable = !fetchProfileDataError && profileFromTimelineFetch?.flamebearer.numTicks === 0;
  const noProfileDataAvailable = !fetchProfileDataError && profile?.flamebearer.numTicks === 0;

  return {
    data: {
      isLoading: isFetchingTimeline || isFetchingProfile || isFetchingSettings,
      fetchTimelineDataError,
      fetchProfileDataError,
      noTimelineDataAvailable,
      noProfileDataAvailable,
      mainTimeRange,
      query,
      timeline,
      timelineSelection: {
        from: selectedTimeRange.from.unix(),
        to: selectedTimeRange.to.unix(),
        color: GRAY_TIMELINE_SELECTION_COLORS.COLOR,
        overlayColor: GRAY_TIMELINE_SELECTION_COLORS.OVERLAY,
      },
      profile,
      shouldDisplayFlamegraph: Boolean(!fetchProfileDataError && !noProfileDataAvailable && profile),
      fetchSettingsError,
      settings,
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
