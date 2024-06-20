import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';

export function getProfileMetricUnit(profileMetricId: string) {
  const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
  return profileMetric.unit;
}
