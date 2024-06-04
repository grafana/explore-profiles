import { TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';

import { QueryAnalysisResult } from '../domain/QueryAnalysis';

class QueryAnalysisApiClient extends ApiClient {
  async get(timeRange: TimeRange, query: string): Promise<QueryAnalysisResult> {
    const queryAnalysisResponse = await this.fetch('/querier.v1.QuerierService/AnalyzeQuery', {
      method: 'POST',
      body: JSON.stringify({
        start: timeRange.from.unix() * 1000,
        end: timeRange.to.unix() * 1000,
        query: query,
      }),
    });

    return await queryAnalysisResponse.json();
  }
}

export const queryAnalysisApiClient = new QueryAnalysisApiClient();
