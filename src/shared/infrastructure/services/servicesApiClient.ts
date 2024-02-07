import { TimeRange } from '@grafana/data';

import { ApiClient } from '../http/ApiClient';
import { getProfileMetric, ProfileMetric } from '../profile-metrics/getProfileMetric';

type ServiceProfileMetrics = Map<ProfileMetric['id'], ProfileMetric>;

export type Services = Map<string, ServiceProfileMetrics>;

class ServicesApiClient extends ApiClient {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  static formatResponseData(data: any): Services {
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

  list({ timeRange }: { timeRange: TimeRange }): Promise<Services> {
    const start = timeRange.from.unix() * 1000;
    const end = timeRange.to.unix() * 1000;

    return this.fetch('/querier.v1.QuerierService/Series', {
      method: 'POST',
      body: JSON.stringify({
        start,
        end,
        labelNames: ['service_name', '__profile_type__'],
        matchers: [],
      }),
    })
      .then((response) => response.json())
      .then((json) => ServicesApiClient.formatResponseData(json));
  }
}

export const servicesApiClient = new ServicesApiClient();
