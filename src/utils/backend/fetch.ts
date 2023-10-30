import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

/**
 * Collect in-flight requests to avoid repeating them
 */
const cachedRequestPromises = new Map<string, Promise<FetchResponse<unknown>>>();

/**
 * The time limit for keeping successful requests around
 */
const DUPLICATE_URL_CACHE_TIMEOUT_MILLISECONDS = 100_000;

/** A simple, light, Grafana URL that will help trigger an abort */
const NULL_URL = '/api/orgs'

/**
 * Fetch makes requests to the plugin backend through Grafana's backend service.
 * 
 * It uses similar parameters to the standard fetch api, but delegates to Grafana's fetch method.
 * The standard fetch api allows for a signal to cancel a request. Pyroscope uses this,
 * so this code attempts to emulate cancellation through Grafana's backend service requestIds.
 *
 * If multiple requests are made within a time window, defined in part by
 * `DUPLICATE_URL_CACHE_TIMEOUT_MILLISECONDS`, then a new request will not be issued,
 * and instead the cached promise will be returned.
 * The time window is the duration required for the request to succeed, plus
 * `DUPLICATE_URL_CACHE_TIMEOUT_MILLISECONDS`.
 */
export default async function fetch(url: string, config?: RequestInit) {
  const requestId = url;
  const { signal, method, body } = config || {};

  function getFetchRequest() {
    const cachedPromise = cachedRequestPromises.get(requestId);
    
    if (cachedPromise) {
      // Don't bother initiating a fetch if we have one currently on the go or recently returned
      return cachedPromise;
    }


    const observable = getBackendSrv().fetch({
      method,
      url,
      data: body,
      requestId,
    });

    // Listen to the abort signal
    signal?.addEventListener('abort', function abort() {
      // By fetching with the same requestId, previous requestId requests
      // will be cancelled by the backend service. The url does not matter.
      const cancelFetch = getBackendSrv().fetch({
        url: NULL_URL,
        requestId,
      });
      signal.removeEventListener('abort', abort);
      function noop(){};
      lastValueFrom(cancelFetch).then(noop, noop);
    });

    const promise = lastValueFrom(observable);

    cachedRequestPromises.set(requestId, promise);

    promise.then(
      // Delete cached promise `DUPLICATE_URL_CACHE_TIMEOUT_MILLISECONDS` after successful fetch
      () => setTimeout(() => cachedRequestPromises.delete(requestId), DUPLICATE_URL_CACHE_TIMEOUT_MILLISECONDS),
      // Delete cached promise immediately on error.
      () => cachedRequestPromises.delete(requestId)
    );

    return promise;
  }

  const response = await getFetchRequest();
  return response;
}
