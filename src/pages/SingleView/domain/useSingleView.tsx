import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { useUserQuery } from './useUserQuery';
import { useUserTimeRange } from './useUserTimeRange';

export function useSingleView() {
  const [query, setQuery] = useUserQuery();
  const [timeRange] = useUserTimeRange();

  const { isPending, error, profile, timeline } = useFetchProfileAndTimeline(query, timeRange);
  const isLoading = isPending && !error;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  return {
    query,
    setQuery,
    isLoading,
    error,
    profile,
    timeline,
    timelinePanelTitle,
  };
}
