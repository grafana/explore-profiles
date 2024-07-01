import { getProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';

import { ServiceToProfileMetricsMap } from './SeriesApiClient';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function formatSeriesResponse(data: any): ServiceToProfileMetricsMap {
  const services: ServiceToProfileMetricsMap = new Map();

  if (!data.labelsSet) {
    console.warn('Pyroscope ServicesApiClient: no data received!');
    return services;
  }

  for (const { labels } of data.labelsSet) {
    let serviceName;
    let profileMetricId;

    for (const { name, value } of labels) {
      if (name === 'service_name') {
        serviceName = value;
      }

      if (name === '__profile_type__') {
        profileMetricId = value;
      }

      if (serviceName && profileMetricId) {
        break;
      }
    }

    if (!serviceName || !profileMetricId) {
      console.warn(
        'Pyroscope ServicesApiClient: "service_name" and/or "__profile_type__" are missing in the data received!'
      );
      return services;
    }

    const serviceProfileMetrics = services.get(serviceName) || new Map();

    serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId));

    services.set(serviceName, serviceProfileMetrics);
  }

  return services;
}
