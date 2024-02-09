import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useGetProfileMetricByType } from '@shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';

import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';

export function useSingleView() {
  const [query, setQuery] = useQueryFromUrl();
  const [timeRange, setTimeRange] = useTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  const {
    isFetching,
    error: fetchDataError,
    timeline,
    profile,
    refetch,
  } = useFetchProfileAndTimeline({
    // determining query and maxNodes can be asynchronous
    enabled: Boolean(query && maxNodes),
    query,
    timeRange,
    maxNodes,
  });

  // determining query and maxNodes can be asynchronous
  const isLoading = !query || !maxNodes || isFetchingSettings || isFetching;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  return {
    data: {
      query,
      timeRange,
      isLoading,
      fetchDataError,
      timeline,
      profile,
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
