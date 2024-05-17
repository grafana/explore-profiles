import { dateTimeParse, TimeRange } from '@grafana/data';

import { ApiClient } from '../http/ApiClient';
import { getProfileMetric, ProfileMetric } from '../profile-metrics/getProfileMetric';

type ServiceProfileMetrics = Map<ProfileMetric['id'], ProfileMetric>;

export type Services = Map<string, ServiceProfileMetrics>;

export class ServicesApiClient extends ApiClient {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  static formatResponseData(data: any): Services {
    const services: Services = new Map();

    if (!data.labelsSet) {
      console.warn('ServicesApiClient: no data received!');
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
      }

      const serviceProfileMetrics = services.get(serviceName) || new Map();

      serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId));

      services.set(serviceName, serviceProfileMetrics);
    }

    return services;
  }

  list({ timeRange }: { timeRange: TimeRange }): Promise<Services> {
    // all /querier requests: timerange in Unix time ms (unix * 1000)
    const start = Number(dateTimeParse(timeRange.raw.from).unix()) * 1000;
    const end = Number(dateTimeParse(timeRange.raw.to).unix()) * 1000;

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
