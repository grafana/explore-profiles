import { dateTimeParse, TimeRange } from '@grafana/data';

import { formatSeriesResponse } from '../../../pages/ProfilesExplorerView/infrastructure/series/http/formatSeriesResponse';
import { ApiClient } from '../http/ApiClient';
import { ProfileMetric } from '../profile-metrics/getProfileMetric';

type ServiceProfileMetrics = Map<ProfileMetric['id'], ProfileMetric>;

export type Services = Map<string, ServiceProfileMetrics>;

export class ServicesApiClient extends ApiClient {
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
      .then(formatSeriesResponse)
      .then((series) => series.services);
  }
}

export const servicesApiClient = new ServicesApiClient();
