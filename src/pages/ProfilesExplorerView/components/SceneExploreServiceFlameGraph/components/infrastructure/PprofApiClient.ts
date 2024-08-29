import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';

import { DataSourceProxyClient } from '../../../../infrastructure/series/http/DataSourceProxyClient';
import { PprofRequest } from './PprofRequest';

type SelectMergeProfileParams = {
  query: string;
  timeRange: TimeRange;
  maxNodes: number;
};

export class PprofApiClient extends DataSourceProxyClient {
  static buildPprofRequest(query: string, timeRange: TimeRange, maxNodes: number): Uint8Array {
    const { profileMetricId, labelsSelector } = parseQuery(query);

    const start = timeRange.from.unix() * 1000;
    const end = timeRange.to.unix() * 1000;

    const message = new PprofRequest(profileMetricId, labelsSelector, start, end, maxNodes);

    return PprofRequest.encode(message).finish();
  }

  async selectMergeProfile({ query, timeRange, maxNodes }: SelectMergeProfileParams): Promise<Blob> {
    const response = await this.fetch('/querier.v1.QuerierService/SelectMergeProfile', {
      method: 'POST',
      headers: { 'content-type': 'application/proto' },
      body: new Blob([PprofApiClient.buildPprofRequest(query, timeRange, maxNodes)]),
    });

    return response.blob();
  }
}
