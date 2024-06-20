export abstract class AbstractRepository<T, U> {
  apiClient: T | undefined;
  cacheClient: U | undefined;

  constructor(options?: { apiClient?: T; cacheClient?: U }) {
    this.apiClient = options?.apiClient;
    this.cacheClient = options?.cacheClient;
  }

  setApiClient(apiClient: T) {
    this.apiClient = apiClient;
  }

  setCacheClient(cacheClient: U) {
    this.cacheClient = cacheClient;
  }

  abstract list(options: Record<string, any>): Promise<unknown>;
}
