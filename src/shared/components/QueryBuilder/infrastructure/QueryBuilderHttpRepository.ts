import { HttpClient } from '../../../infrastructure/http/HttpClient';

export class QueryBuilderHttpRepository<THttpClient extends HttpClient> {
  apiClient: THttpClient | undefined;

  constructor(options: { apiClient?: THttpClient }) {
    this.apiClient = options.apiClient;
  }

  setApiClient(apiClient: THttpClient) {
    this.apiClient = apiClient;
  }

  cancel(reason: any) {
    this.apiClient!.abort(reason);
  }
}
