import { TimeRange } from '@grafana/data';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchDiffProfile } from '../components/FlameGraphContainer/infrastructure/useFetchDiffProfile';
import { useFetchLeftProfile } from '../infrastructure/useFetchLeftProfile';
import { useFetchLeftTimeLine } from '../infrastructure/useFetchLeftTimeLine';
import { useFetchRightProfile } from '../infrastructure/useFetchRightProfile';
import { useFetchRightTimeline } from '../infrastructure/useFetchRightTimeline';
import { BASELINE_COLORS, COMPARISON_COLORS } from '../ui/colors';
import { syncTimelineModes } from './syncTimelineModes';
import { useDefaultComparisonParamsFromUrl } from './useDefaultComparisonParamsFromUrl';

export function useComparisonView(diff: boolean): DomainHookReturnValue {
  const [mainTimeRange, setMainTimeRange] = useTimeRangeFromUrl();
  const [query] = useQueryFromUrl();
  const { left, right } = useDefaultComparisonParamsFromUrl();

  const {
    isFetching: isFetchingLeftTimeline,
    error: fetchLeftTimelineDataError,
    timeline: leftTimeline,
    profile: leftProfile,
    refetch: refetchLeftTimeline,
  } = useFetchLeftTimeLine();

  const {
    isFetching: isFetchingRightTimeline,
    error: fetchRightTimelineDataError,
    timeline: rightTimeline,
    profile: rightProfile,
    refetch: refetchRightTimeline,
  } = useFetchRightTimeline();

  const { refetch: refetchLeftProfile } = useFetchLeftProfile();
  const { refetch: refetchRightProfile } = useFetchRightProfile();
  const { refetch: refetchDiffProfile } = useFetchDiffProfile({ disabled: !diff });

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
        color: BASELINE_COLORS.COLOR,
        overlayColor: BASELINE_COLORS.OVERLAY,
      },
      fetchRightTimelineDataError,
      // TODO: improve
      noRightDataAvailable: !fetchRightTimelineDataError && rightProfile?.flamebearer.numTicks === 0,
      rightTimeline,
      rightTimelineSelection: {
        from: right.timeRange.from.unix(),
        to: right.timeRange.to.unix(),
        color: COMPARISON_COLORS.COLOR,
        overlayColor: COMPARISON_COLORS.OVERLAY,
      },
    },
    actions: {
      setMainTimeRange(newMainTimeRange: TimeRange) {
        setMainTimeRange(newMainTimeRange);
        syncTimelineModes(newMainTimeRange, left, right);
      },
      resetQueries(newServiceId: string) {
        const newQuery = buildQuery({
          ...parseQuery(query),
          serviceId: newServiceId,
        });

        left.setQuery(newQuery);
        right.setQuery(newQuery);
      },
      updateQueries(newProfileMetricId: string) {
        left.setQuery(
          buildQuery({
            ...parseQuery(left.query),
            profileMetricId: newProfileMetricId,
          })
        );

        right.setQuery(
          buildQuery({
            ...parseQuery(right.query),
            profileMetricId: newProfileMetricId,
          })
        );
      },
      refresh() {
        refetchLeftTimeline();
        refetchLeftProfile();
        refetchRightTimeline();
        refetchRightProfile();
        refetchDiffProfile();
      },
    },
  };
}
