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
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';

export function useSingleView(): DomainHookReturnValue {
  const [query, setQuery] = useQueryFromUrl();
  const [timeRange, setTimeRange] = useTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  // determining query and maxNodes can be asynchronous so we enable the main query only when we have values for both
  const enabled = Boolean(query && maxNodes);

  const {
    isFetching,
    error: fetchDataError,
    timeline,
    profile,
    refetch: refetchProfileAndTimeline,
  } = useFetchProfileAndTimeline({
    enabled,
    query,
    timeRange,
    maxNodes,
  });

  const { services, refetch: refetchServices, isFetching: isFetchingServices } = useFetchServices({ timeRange });

  const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

  const isLoading = isFetchingSettings || isFetching;

  // TODO: improve?
  const noDataAvailable =
    !fetchDataError && ((!isFetchingServices && services.size === 0) || profile?.flamebearer.numTicks === 0);

  const shouldDisplayFlamegraph = Boolean(!fetchDataError && !noDataAvailable && profile);

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
      noDataAvailable,
      shouldDisplayFlamegraph,
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
