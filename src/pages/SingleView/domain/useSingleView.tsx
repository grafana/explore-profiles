import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchPluginSettings } from '../../../shared/infrastructure/settings/useFetchPluginSettings';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { useUserQuery } from './useUserQuery';
import { useUserTimeRange } from './useUserTimeRange';

export function useSingleView() {
  const [query, setQuery] = useUserQuery();
  const [timeRange, setTimeRange] = useUserTimeRange();

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  // TODO: UX -> keep internal state with timeline & profile to prevent re-renders with empty panels
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
    query,
    setQuery,
    timeRange,
    setTimeRange,
    isLoading,
    fetchDataError,
    profile,
    timeline,
    timelinePanelTitle,
    refetch: () => refetch(),
    fetchSettingsError,
    settings,
  };
}
