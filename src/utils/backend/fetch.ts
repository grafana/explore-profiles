import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

const cachedPromises = new Map<string, Promise<FetchResponse<unknown>>>();

const CACHE_TIMEOUT_MILLISECONDS = 1_000;

const buildCacheKey = (url: string, config?: RequestInit) => `${config?.method || 'GET'}-${url}-${config?.body}`;

/**
 * Fetch makes requests to the plugin backend through Grafana's backend service.
 * It uses similar parameters to the standard fetch api, but delegates to Grafana's fetch method.
 *
 * We also add a cache to prevent the same request to be made in a short window if time.
 * This happens when Pyroscope is mounting then unmounting immediately its page components (e.g. when the query in the URL is empty then it's updated to a default value).
 * */
export default async function fetch(url: string, config?: RequestInit) {
  const cacheKey = buildCacheKey(url, config);
  const cachedPromise = cachedPromises.get(cacheKey);

  if (cachedPromise) {
    return cachedPromise;
  }

  // TODO: when migrating Pyroscope OSS code base here, we'll have to add request cancellation.
  // It might be a bit tricky because getBackendSrv() does not currently support it.
  // It only allows us to pass a requestId and, if a request with the same id is made later, it cancels the previous request before making the new one.

  // We could use a hack that consists of adding a request id and listening to config.signal "abort" events. Whenever the event is received, we could make a dummy request
  // with getBackendSrv with the same request id.
  // Unfortunately, it does not work because of a race condition with Pyroscope OSS (e.g. in public/app/redux/reducers/continuous/tagExplorer.thunks.ts)
  // We would end up cancelling the wrong request, leaving the user with a blank page.
  const observable = getBackendSrv().fetch({
    url,
    method: config?.method,
    data: config?.body,
  });

  const promise = lastValueFrom(observable);

  cachedPromises.set(cacheKey, promise);

  const removeCacheItem = () => {
    cachedPromises.delete(cacheKey);
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
