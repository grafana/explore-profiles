import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useLeftQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/useFetchTimelineAndProfile';

export function useFetchLeftTimeLine() {
  const [mainTimeRange] = useTimeRangeFromUrl();
  const [query] = useLeftQueryFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  return useFetchTimelineAndProfile({ target: 'left-timeline', query, timeRange: mainTimeRange, maxNodes });
}
