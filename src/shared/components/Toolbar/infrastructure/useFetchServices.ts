import { useQuery } from '@tanstack/react-query';

import { ApiClient } from '../../../infrastructure/http/ApiClient';
import { getProfileMetric, ProfileMetric } from '../../../infrastructure/profile-metrics/getProfileMetric';
import { TimeRange } from '../../../types/TimeRange';

const apiClient = new ApiClient();

type ServiceProfileMetrics = Map<ProfileMetric['id'], ProfileMetric>;

export type Services = Map<string, ServiceProfileMetrics>;

type FetchParams = TimeRange;

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  services: Services;
  refetch: () => void;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
function formatResponseData(data: any): Services {
  if (!data.labelsSet) {
    throw new TypeError('No labelsSet received!');
  }

  const services: Services = new Map();

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
    }

    const serviceProfileMetrics = services.get(serviceName) || new Map();

    serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId));

    services.set(serviceName, serviceProfileMetrics);
  }

  return services;
}

export function useFetchServices(timeRange: FetchParams): FetchResponse {
  const { from, until } = timeRange;

  const { isFetching, error, data, refetch } = useQuery({
    queryKey: [from, until],
    queryFn: () =>
      apiClient
        .fetch('/querier.v1.QuerierService/Series', {
          method: 'POST',
          body: JSON.stringify({
            start: Number(from) * 1000 || 0,
            end: Number(until) * 1000 || 0,
            labelNames: ['service_name', '__profile_type__'],
            matchers: [],
          }),
        })
        .then((response) => response.json())
        .then((json) => formatResponseData(json)),
  });

  return {
    isFetching,
    error: apiClient.isAbortError(error) ? null : error,
    services: data || new Map(),
    refetch: () => refetch(),
  };
}
