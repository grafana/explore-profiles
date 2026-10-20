import { LabelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';
import { LabelsApiClient } from 'src/pages/ProfilesExplorerView/infrastructure/labels/http/LabelsApiClient';

// Keep query-builder cancellation from aborting group-by label requests.
export class QueryBuilderLabelsRepository extends LabelsRepository {
  private readonly apiClients = new Map<string, LabelsApiClient>();

  override getApiClient(dataSourceUid: string) {
    const cachedClient = this.apiClients.get(dataSourceUid);
    if (cachedClient) {
      return cachedClient;
    }

    const apiClient = new LabelsApiClient({ dataSourceUid });
    this.apiClients.set(dataSourceUid, apiClient);
    return apiClient;
  }
}

export const queryBuilderLabelsRepository = new QueryBuilderLabelsRepository({
  cacheClient: new MemoryCacheClient(),
});
