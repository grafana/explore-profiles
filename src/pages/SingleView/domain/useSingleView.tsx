import { useGetProfileMetricByType } from '../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchProfileAndTimeline } from '../infrastructure/useFetchProfileAndTimeline';
import { useUserQuery } from './useUserQuery';
import { useUserTimeRange } from './useUserTimeRange';

export function useSingleView() {
  const [query, setQuery] = useUserQuery();
  const [timeRange, setTimeRange] = useUserTimeRange();

  // TODO: UX -> keep internal state with timeline & profile to prevent re-renders with empty panels
  const { isPending, error, profile, timeline } = useFetchProfileAndTimeline(query, timeRange);
  const isLoading = isPending && !error;

  const timelinePanelTitle = useGetProfileMetricByType(profile?.metadata?.name)?.description;

  return {
    query,
    setQuery,
    setTimeRange,
    isLoading,
    error,
    profile,
    timeline,
    timelinePanelTitle,
  };
}
