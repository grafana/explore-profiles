import { MetricFindValue } from '@grafana/data';

import { PyroscopeSeries } from './http/SeriesApiClient';

export function formatSeriesToServices(pyroscopeSeries: PyroscopeSeries, profileMetricId?: string): MetricFindValue[] {
  if (profileMetricId) {
    const servicesSet = pyroscopeSeries.profileMetrics.get(profileMetricId) || new Set();

    return Array.from(servicesSet)
      .sort((a, b) => a.localeCompare(b))
      .map((serviceName) => ({
        text: serviceName,
        value: serviceName,
      }));
  }

  return Array.from(pyroscopeSeries.services.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((serviceName) => ({
      text: serviceName,
      value: serviceName,
    }));
}
