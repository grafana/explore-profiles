import { MetricFindValue } from '@grafana/data';

import { ProfileMetricsMap, ServiceToProfileMetricsMap } from './http/SeriesApiClient';

export function formatSeriesToProfileMetrics(
  serviceToProfileMetricsMap: ServiceToProfileMetricsMap
): MetricFindValue[] {
  const allProfileMetricsMap: ProfileMetricsMap = new Map();

  for (const profileMetrics of serviceToProfileMetricsMap.values()) {
    for (const [id, metric] of profileMetrics) {
      allProfileMetricsMap.set(id, metric);
    }
  }

  return Array.from(allProfileMetricsMap.values())
    .sort((a, b) => b.group.localeCompare(a.group))
    .map(({ id, type, group }) => ({
      value: id,
      text: `${type} (${group})`,
    }));
}
