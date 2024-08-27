import { TimeRange } from '@grafana/data';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { PprofProfile } from '@shared/types/PprofProfile';

import { PprofRequestWithoutMaxNodes } from './PprofRequestWithoutMaxNodes';

type SelectMergeProfileProps = {
  profileMetricId: string;
  labelsSelector: string;
  start: number;
  end: number;
  stacktrace: string[];
  maxNodes: number;
};

class PprofApiClient extends ApiClient {
  static buildQuery(query: string, timeRange: TimeRange): Uint8Array {
    const { profileMetricId, labelsSelector } = parseQuery(query);
    const start = timeRange.from.unix() * 1000;
    const end = timeRange.to.unix() * 1000;

    const message = new PprofRequestWithoutMaxNodes(profileMetricId, labelsSelector, start, end);

    return PprofRequestWithoutMaxNodes.encode(message).finish();
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

export const pprofApiClient = new PprofApiClient();
