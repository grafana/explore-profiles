import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useRightQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useRightTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/useFetchTimelineAndProfile';

export function useFetchRightProfile() {
  const [query] = useRightQueryFromUrl();
  const [selectedTimeRange] = useRightTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  return useFetchTimelineAndProfile({ target: 'right-profile', query, timeRange: selectedTimeRange, maxNodes });
}
