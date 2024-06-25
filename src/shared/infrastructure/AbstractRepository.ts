import { ApiClient } from './http/ApiClient';

export abstract class AbstractRepository<T extends ApiClient> {
  apiClient?: T;

  constructor(options: { apiClient?: T }) {
    this.apiClient = options.apiClient;
  }

  setApiClient(apiClient: T) {
    this.apiClient = apiClient;
  }

  cancel(reason: any) {
    this.apiClient!.abort(reason);
  }
}
