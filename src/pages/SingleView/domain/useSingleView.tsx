import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchPluginSettings } from '../../../shared/infrastructure/settings/useFetchPluginSettings';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { useQueryFromUrl } from './useQueryFromUrl';
import { useTimeRangeFromUrl } from './useTimeRangeFromUrl';

export function useSingleView() {
  const [query, setQuery] = useQueryFromUrl();
  const [timeRange, setTimeRange] = useTimeRangeFromUrl();

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  const {
    isFetching,
    error: fetchDataError,
    profile,
    timeline,
    refetch,
  } = useFetchProfileAndTimeline({
    query,
    timeRange,
    maxNodes: settings?.maxNodes,
    enabled: Boolean(settings) || Boolean(fetchSettingsError),
  });

  const isLoading = isFetchingSettings || isFetching;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  return {
    data: {
      query,
      timeRange,
      isLoading,
      fetchDataError,
      profile,
      timeline,
      timelinePanelTitle,
      fetchSettingsError,
      settings,
    },
    actions: {
      setQuery,
      setTimeRange,
      refetch: () => refetch(),
    },
  };
}
