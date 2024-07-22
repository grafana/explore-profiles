import { MetricFindValue } from '@grafana/data';

import { ServiceToProfileMetricsMap } from './http/SeriesApiClient';

export function formatSeriesToServices(serviceToProfileMetricsMap: ServiceToProfileMetricsMap): MetricFindValue[] {
  return Array.from(serviceToProfileMetricsMap.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((serviceName) => ({
      text: serviceName,
      value: serviceName,
    }));
}
