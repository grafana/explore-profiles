import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Services } from '@shared/infrastructure/services/servicesApiClient';

export type ProfileMetricOptions = Array<{ value: string; label: string }>;

export function getProfileMetricOptions(services: Services) {
  const allProfileMetricsMap = new Map<ProfileMetric['id'], ProfileMetric>();

  for (const profileMetrics of services.values()) {
    for (const [id, metric] of profileMetrics) {
      allProfileMetricsMap.set(id, metric);
    }
  }

  const allProfileMetrics = Array.from(allProfileMetricsMap.values())
    .sort((a, b) => a.type.localeCompare(b.type))
    .map(({ id, type, group }) => ({
      value: id,
      label: `${type} (${group})`,
      type,
      group,
    }));

  return allProfileMetrics;
}
