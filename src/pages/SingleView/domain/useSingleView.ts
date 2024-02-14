import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import {
  getProfileMetric,
  getProfileMetricByType,
  ProfileMetricId,
} from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
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
    refetch: refetchProfileAndTimeline,
  } = useFetchProfileAndTimeline({
    // determining query and maxNodes can be asynchronous
    enabled: Boolean(query && maxNodes),
    query,
    timeRange,
    maxNodes,
  });

  const { refetch: refetchServices } = useFetchServices({ timeRange });

  const isLoading = isFetchingSettings || isFetching;

  const timelinePanelTitle =
    getProfileMetric(parseQuery(query).profileMetricId as ProfileMetricId).description ||
    getProfileMetricByType(profile?.metadata.name as string)?.description ||
    '';

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
      refresh() {
        refetchProfileAndTimeline();
        refetchServices();
      },
    },
  };
}
