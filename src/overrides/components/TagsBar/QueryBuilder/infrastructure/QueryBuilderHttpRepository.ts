import { HttpClient } from './http/HttpClient';

export class QueryBuilderHttpRepository<THttpClient extends HttpClient> {
  httpClient: THttpClient;

  constructor(httpClient: THttpClient) {
    this.httpClient = httpClient;
  }

  cancel(reason: any) {
    this.httpClient.abort(reason);
  }
}
