export class HttpClient {
  baseUrl = '';
  defaultHeaders = {};
  abortController?: AbortController | null = null;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = Object.freeze(defaultHeaders);
  }

  async fetch(pathname: string, options?: RequestInit) {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const fullUrl = `${this.baseUrl}${pathname}`;
    const headers = { ...this.defaultHeaders, ...options?.headers };
    const fullOptions = {
      ...options,
      headers,
      signal,
    };

    let response;

    try {
      response = await fetch(fullUrl, fullOptions);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} (${response.statusText})`);
      }
    } catch (error) {
      (error as any).reason = signal.reason;
      throw error;
    }

    this.abortController = null;

    return response;
  }

  abort(reason?: any) {
    if (this.abortController) {
      this.abortController.abort(reason);
    }
  }

  isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
