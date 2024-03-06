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
      signal, // we allow signal to be passed as an option
      ...options,
      headers,
    };

    let response;

    try {
      response = await fetch(fullUrl, fullOptions);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} (${response.statusText})`);
      }
    } catch (error) {
      if (response) {
        (error as any).response = response;
      }

      if (this.isAbortError(error)) {
        (error as any).reason = options?.signal?.reason || signal.reason;
      }

      throw error;
    } finally {
      this.abortController = null;
    }

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
