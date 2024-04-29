import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import Color from 'color';

import { useFetchLeftProfile } from '../infrastructure/useFetchLeftProfile';
import { useFetchLeftTimeLine } from '../infrastructure/useFetchLeftTimeLine';
import { useFetchRightProfile } from '../infrastructure/useFetchRightProfile';
import { useFetchRightTimeline } from '../infrastructure/useFetchRightTimeline';
import { syncTimelineModes } from './syncTimelineModes';
import { useComparisonParamsFromUrl } from './useComparisonParamsFromUrl';

export const LEFT_TIMELINE_COLORS = {
  COLOR: Color('#d066d4'),
  OVERLAY: Color('#d066d4').alpha(0.3),
};

export const RIGHT_TIMELINE_COLORS = {
  COLOR: Color('#1398f6'),
  OVERLAY: Color('#1398f6').alpha(0.3),
};

export const GRAY_TIMELINE_SELECTION_COLORS = {
  COLOR: Color('#f0f0f0'),
  OVERLAY: Color('#f0f0f0').alpha(0.3),
};

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
