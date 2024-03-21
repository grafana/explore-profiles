export class HttpClientError extends Error {
  response: Response;
  reason?: any;

  constructor(response: Response, responseJson?: Record<string, any>) {
    let message = `HTTP ${response.status} (${response.statusText || '?'})`;

    if (responseJson?.message) {
      message = `${message} → ${responseJson.message}`;
    }

    super(message);

    this.response = response;
  }
}
