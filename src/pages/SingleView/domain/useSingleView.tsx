import { useFetchPluginSettings } from '../../../pages/SettingsView/infrastructure/useFetchPluginSettings';
import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { useUserQuery } from './useUserQuery';
import { useUserTimeRange } from './useUserTimeRange';

export function useSingleView() {
  const [query, setQuery] = useUserQuery();
  const [timeRange, setTimeRange] = useUserTimeRange();

  const { error: fetchSettingsError, settings } = useFetchPluginSettings();

  // TODO: UX -> keep internal state with timeline & profile to prevent re-renders with empty panels
  const {
    isPending,
    error: fetchDataError,
    profile,
    timeline,
  } = useFetchProfileAndTimeline({
    query,
    timeRange,
    maxNodes: settings?.maxNodes,
    enabled: Boolean(settings) || Boolean(fetchSettingsError),
  });

  const isLoading = isPending && !fetchDataError;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  return {
    query,
    setQuery,
    setTimeRange,
    isLoading,
    fetchDataError,
    profile,
    timeline,
    timelinePanelTitle,
    fetchSettingsError,
  };
}
