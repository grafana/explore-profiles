import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { connectRequestCancellation } from './cancelling';

type CachedRequest = {
  promise: Promise<FetchResponse<unknown>>;
  requestId: string;
};

const cachedRequests = new Map<string, CachedRequest>();

const CACHE_TIMEOUT_MILLISECONDS = 1_000;

const buildCacheKey = (url: string, config?: RequestInit) => `${config?.method || 'GET'}-${url}-${config?.body}`;

let requestsCount = 0;
const buildRequestId = () => `grafana-pyroscope-app-req:${++requestsCount}`;

/**
 * Fetch makes requests through Grafana's backend service.
 *
 * It uses similar parameters to the standard fetch api, which originate from pyroscope,
 * but delegates through Grafana's fetch method.
 *
 * We also add a cache to prevent the same request to be made in a short window if time.
 * This happens when Pyroscope is mounting then unmounting immediately its page components (e.g. when the query in the URL is empty then it's updated to a default value).
 *
 * The `config` object may contain a `signal` field, which can be used as an `AbortSignal`.
 * If it is present, we will listen for the signal and use Grafana backend service methods to
 * cancel that inflight request (or the original request in the event that a cached request is accessed).
 * */
export default async function fetch(url: string, config?: RequestInit) {
  const requestId = buildRequestId();
  const cacheKey = buildCacheKey(url, config);
  const cachedRequest = cachedRequests.get(cacheKey);

  if (cachedRequest) {
    if (config?.signal) {
      // If this call to `fetch` comes with a cancellation signal,
      // we want to make sure that the signal cancels the originally cached request.
      connectRequestCancellation(cachedRequest.requestId, config.signal);
    }
    return cachedRequest.promise;
  }

  if (config?.signal) {
    connectRequestCancellation(requestId, config.signal);
  }

  // The requestId gives us a handle which we can use to cancel the request.

  const observable = getBackendSrv().fetch({
    url,
    method: config?.method,
    data: config?.body,
    requestId,
  });

  const promise = lastValueFrom(observable);

  cachedRequests.set(cacheKey, { promise, requestId });

  const removeCacheItem = () => {
    cachedRequests.delete(cacheKey);
  };

  return promise
    .then((response) => {
      setTimeout(removeCacheItem, CACHE_TIMEOUT_MILLISECONDS);
      return response;
    })
    .catch((error) => {
      removeCacheItem();
      throw error;
    });
}
