import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { PprofProfile } from '@shared/types/PprofProfile';

import { DataSourceProxyClient } from '../../../../infrastructure/series/http/DataSourceProxyClient';
import { PprofRequest } from './PprofRequest';

type SelectMergeProfileProps = {
  profileMetricId: string;
  labelsSelector: string;
  start: number;
  end: number;
  stacktrace: string[];
  maxNodes: number;
};

export class PprofApiClient extends DataSourceProxyClient {
  static buildQuery(query: string, timeRange: TimeRange): Uint8Array {
    const { profileMetricId, labelsSelector } = parseQuery(query);
    const start = timeRange.from.unix() * 1000;
    const end = timeRange.to.unix() * 1000;

    const message = new PprofRequest(profileMetricId, labelsSelector, start, end);

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

    return response.blob();
  }

  async selectMergeProfileJson({
    profileMetricId,
    labelsSelector,
    start,
    end,
    stacktrace,
    maxNodes,
  }: SelectMergeProfileProps): Promise<PprofProfile> {
    const response = await this.fetch('/querier.v1.QuerierService/SelectMergeProfile', {
      method: 'POST',
      body: JSON.stringify({
        profile_typeID: profileMetricId,
        label_selector: labelsSelector,
        start,
        end,
        stackTraceSelector: {
          call_site: stacktrace.map((name) => ({ name })),
        },
        maxNodes,
      }),
    });

    return response.json();
  }
}
