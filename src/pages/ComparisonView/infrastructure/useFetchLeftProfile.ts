import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useLeftQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useLeftTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchTimelineAndProfile } from '@shared/infrastructure/timeline-profile/useFetchTimelineAndProfile';

export function useFetchLeftProfile() {
  const [query] = useLeftQueryFromUrl();
  const [selectedTimeRange] = useLeftTimeRangeFromUrl();
  const [maxNodes] = useMaxNodesFromUrl();

  return useFetchTimelineAndProfile({ target: 'left-profile', query, timeRange: selectedTimeRange, maxNodes });
}
