import { ApiClient } from './http/ApiClient';

export abstract class AbstractRepository<T extends ApiClient, U> {
  apiClient?: T;
  cacheClient: U | undefined;

  constructor(options: { apiClient?: T; cacheClient?: U }) {
    this.apiClient = options.apiClient;
    this.cacheClient = options?.cacheClient;
  }

  setApiClient(apiClient: T) {
    this.apiClient = apiClient;
  }

  setCacheClient(cacheClient: U) {
    this.cacheClient = cacheClient;
  }

  cancel(reason: any) {
    this.apiClient!.abort(reason);
  }
}
