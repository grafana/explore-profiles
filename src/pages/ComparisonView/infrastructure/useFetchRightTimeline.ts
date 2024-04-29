import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useRightQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/useFetchTimelineAndProfile';

export function useFetchRightTimeline() {
  const [mainTimeRange] = useTimeRangeFromUrl();
  const [query] = useRightQueryFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  return useFetchTimelineAndProfile({ target: 'right-timeline', query, timeRange: mainTimeRange, maxNodes });
}
