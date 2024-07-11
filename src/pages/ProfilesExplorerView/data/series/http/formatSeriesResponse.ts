import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';

import { ServiceToProfileMetricsMap } from './SeriesApiClient';

function findServiceNameAndProfileMetricId(labels: Array<{ name: string; value: string }>) {
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
      return [serviceName, profileMetricId];
    }
  }

  return [];
}

export function formatSeriesResponse(data: any): ServiceToProfileMetricsMap {
  const services: ServiceToProfileMetricsMap = new Map();

  if (!data.labelsSet) {
    console.warn('Pyroscope ServicesApiClient: no data received!');
    return services;
  }

  for (const { labels } of data.labelsSet) {
    const [serviceName, profileMetricId] = findServiceNameAndProfileMetricId(labels);

    if (!serviceName || !profileMetricId) {
      console.warn(
        'Pyroscope ServicesApiClient: "service_name" and/or "__profile_type__" are missing in the labels received!',
        labels
      );
      continue;
    }

    const serviceProfileMetrics = services.get(serviceName) || new Map();

    serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId as ProfileMetricId));

    services.set(serviceName, serviceProfileMetrics);
  }

  return services;
}
