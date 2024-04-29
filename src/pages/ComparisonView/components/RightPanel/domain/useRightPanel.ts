import { TimeRange } from '@grafana/data';
import { useRightQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useRightTimeRangeFromUrl, useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { convertAbsoluteToRelativeTimeRange } from '../../../domain/convertAbsoluteToRelativeTimeRange';
import { convertRelativeToAbsoluteTimeRange } from '../../../domain/convertRelativeToAbsoluteTimeRange';
import { getRelativeUnitForSync } from '../../../domain/getRelativeUnitForSync';
import { isRelativeTimeRange } from '../../../domain/isRelativeTimeRange';
import { GRAY_TIMELINE_SELECTION_COLORS } from '../../../domain/useComparisonView';
import { useFetchRightProfile } from '../../../infrastructure/useFetchRightProfile';
import { useFetchRightTimeline } from '../../../infrastructure/useFetchRightTimeline';

// Comparison panel
export function useRightPanel(): DomainHookReturnValue {
  const [mainTimeRange] = useTimeRangeFromUrl();
  const [query, setQuery] = useRightQueryFromUrl();
  const [selectedTimeRange, selectTimeRange] = useRightTimeRangeFromUrl();

  const {
    isFetching: isFetchingTimeline,
    error: fetchTimelineDataError,
    timeline,
    profile: profileFromTimelineFetch,
  } = useFetchRightTimeline();

  const { isFetching: isFetchingProfile, error: fetchProfileDataError, profile } = useFetchRightProfile();

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
