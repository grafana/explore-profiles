import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';

import { PprofRequest } from './PprofRequest';

class PprofApiClient extends ApiClient {
  static buildQuery(query: string, timeRange: TimeRange): Uint8Array {
    const { profileMetricId, labelSelector } = parseQuery(query);
    const start = timeRange.from.unix() * 1000;
    const end = timeRange.to.unix() * 1000;

    const message = new PprofRequest(profileMetricId, labelSelector, start, end);

    return PprofRequest.encode(message).finish();
  }

  async selectMergeProfile(query: string, timeRange: TimeRange): Promise<Blob> {
    const response = await this.fetch('/querier.v1.QuerierService/SelectMergeProfile', {
      method: 'POST',
      headers: {
        'content-type': 'application/proto',
      },
      body: new Blob([PprofApiClient.buildQuery(query, timeRange)]),
    });

    const blob = await response.blob();

    return blob;
  }
}

export const pprofApiClient = new PprofApiClient();
