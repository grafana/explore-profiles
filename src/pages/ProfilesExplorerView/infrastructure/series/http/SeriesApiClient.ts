import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';

import { DataSourceProxyClient } from './DataSourceProxyClient';
import { formatSeriesResponse } from './formatSeriesResponse';

export type ProfileMetricsMap = Map<ProfileMetric['id'], ProfileMetric>;
export type ServiceToProfileMetricsMap = Map<string, ProfileMetricsMap>;

export class SeriesApiClient extends DataSourceProxyClient {
  constructor(options: { dataSourceUid: string }) {
    super(options);
  }

  async list(options: { from: number; to: number }): Promise<ServiceToProfileMetricsMap> {
    const { from, to } = options;

    return this.fetch('/querier.v1.QuerierService/Series', {
      method: 'POST',
      body: JSON.stringify({
        start: from,
        end: to,
        labelNames: ['service_name', '__profile_type__'],
        matchers: [],
      }),
    })
      .then((response) => response.json())
      .then(formatSeriesResponse);
  }
}
