import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchLeftProfile } from '../infrastructure/useFetchLeftProfile';
import { useFetchLeftTimeLine } from '../infrastructure/useFetchLeftTimeLine';
import { useFetchRightProfile } from '../infrastructure/useFetchRightProfile';
import { useFetchRightTimeline } from '../infrastructure/useFetchRightTimeline';
import { LEFT_TIMELINE_COLORS, RIGHT_TIMELINE_COLORS } from '../ui/colors';
import { syncTimelineModes } from './syncTimelineModes';
import { useComparisonParamsFromUrl } from './useComparisonParamsFromUrl';

export function useComparisonView(): DomainHookReturnValue {
  const [mainTimeRange, setMainTimeRange] = useTimeRangeFromUrl();
  const [query] = useQueryFromUrl();
  const { left, right } = useComparisonParamsFromUrl();

  const {
    isFetching: isFetchingLeftTimeline,
    error: fetchLeftTimelineDataError,
    timeline: leftTimeline,
    profile: leftProfile,
    refetch: refetchLeftTimeline,
  } = useFetchLeftTimeLine();

  const { refetch: refetchLeftProfile } = useFetchLeftProfile();

  const {
    isFetching: isFetchingRightTimeline,
    error: fetchRightTimelineDataError,
    timeline: rightTimeline,
    profile: rightProfile,
    refetch: refetchRightTimeline,
  } = useFetchRightTimeline();

  const { refetch: refetchRightProfile } = useFetchRightProfile();

  const { profileMetricId } = parseQuery(query);
  const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
  const title = profileMetric ? profileMetric.description || `${profileMetric.type} (${profileMetric.group})` : '';

  return {
    data: {
      title,
      mainTimeRange,
      isLoadingMain: isFetchingLeftTimeline || isFetchingRightTimeline,
      fetchLeftTimelineDataError,
      // TODO: improve
      noLeftDataAvailable: !fetchLeftTimelineDataError && leftProfile?.flamebearer.numTicks === 0,
      leftTimeline,
      leftTimelineSelection: {
        from: left.timeRange.from.unix(),
        to: left.timeRange.to.unix(),
        color: LEFT_TIMELINE_COLORS.COLOR,
        overlayColor: LEFT_TIMELINE_COLORS.OVERLAY,
      },
      fetchRightTimelineDataError,
      // TODO: improve
      noRightDataAvailable: !fetchRightTimelineDataError && rightProfile?.flamebearer.numTicks === 0,
      rightTimeline,
      rightTimelineSelection: {
        from: right.timeRange.from.unix(),
        to: right.timeRange.to.unix(),
        color: RIGHT_TIMELINE_COLORS.COLOR,
        overlayColor: RIGHT_TIMELINE_COLORS.OVERLAY,
      },
    },
    actions: {
      setMainTimeRange(newMainTimeRange: TimeRange) {
        setMainTimeRange(newMainTimeRange);
        syncTimelineModes(newMainTimeRange, left, right);
      },
      refresh() {
        refetchLeftTimeline();
        refetchLeftProfile();
        refetchRightTimeline();
        refetchRightProfile();
      },
    },
  };
}
