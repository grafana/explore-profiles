import { MetricFindValue } from '@grafana/data';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';

import { PyroscopeSeries } from './http/SeriesApiClient';

export function formatSeriesToProfileMetrics(
  pyroscopeSeries: PyroscopeSeries,
  serviceName?: string
): MetricFindValue[] {
  if (serviceName) {
    const profileMetricsMap = pyroscopeSeries.services.get(serviceName) || new Map();

    return Array.from(profileMetricsMap.values())
      .sort((a, b) => b.group.localeCompare(a.group))
      .map(({ id, type, group }) => ({
        value: id,
        text: `${type} (${group})`,
      }));
  }

  return Array.from(pyroscopeSeries.profileMetrics.keys())
    .map((id) => getProfileMetric(id as ProfileMetricId))
    .sort((a, b) => b.group.localeCompare(a.group))
    .map(({ id, type, group }) => ({
      value: id,
      text: `${type} (${group})`,
    }));
}