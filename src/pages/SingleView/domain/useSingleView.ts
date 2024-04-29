import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/useFetchTimelineAndProfile';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

export function useSingleView(): DomainHookReturnValue {
  const [query, setQuery] = useQueryFromUrl();
  const [timeRange, setTimeRange] = useTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  const {
    isFetching,
    error: fetchDataError,
    timeline,
    profile,
    refetch: refetchProfileAndTimeline,
  } = useFetchTimelineAndProfile({ target: 'main', query, timeRange, maxNodes });

  const { services, refetch: refetchServices, isFetching: isFetchingServices } = useFetchServices({ timeRange });

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  const isLoading = isFetchingSettings || isFetching;

  // TODO: improve?
  const noDataAvailable =
    !fetchDataError && ((!isFetchingServices && services.size === 0) || profile?.flamebearer.numTicks === 0);

  const shouldDisplayFlamegraph = Boolean(!fetchDataError && !noDataAvailable && profile);

  const { profileMetricId } = parseQuery(query);
  const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
  const title = profileMetric ? profileMetric.description || `${profileMetric.type} (${profileMetric.group})` : '';

  return {
    data: {
      title,
      query,
      timeRange,
      isLoading,
      fetchDataError,
      timeline,
      profile,
      noDataAvailable,
      shouldDisplayFlamegraph,
      fetchSettingsError,
      settings,
    },
    actions: {
      setQuery,
      setTimeRange,
      refresh() {
        refetchProfileAndTimeline();
        refetchServices();
      },
    },
  };
}
