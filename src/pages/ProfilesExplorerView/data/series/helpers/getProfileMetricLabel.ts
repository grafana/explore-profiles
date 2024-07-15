import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';

export function getProfileMetricLabel(profileMetricId: string) {
  const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
  return `${profileMetric.type} (${profileMetric.group})`;
}
