import { BackendSrv, getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

/** Listen for the abort signal, and cancel the request if it is recieved. */
export function connectRequestCancellation(requestId: string, signal: AbortSignal) {
  // Listen to the abort signal if it is set
  signal?.addEventListener('abort', function abort() {
    signal.removeEventListener('abort', abort);
    cancelRequest(requestId);
  });
}

/**
 * Actual backend service implementation has this method,
 * but it isn't published via the `BackendSrv` interface.
 * We must check for its existence before we can use it.
 */
type ModernBackendSrv = BackendSrv & {
  resolveCancelerIfExists(requestId: string): void;
};

function isModernBackendSrv(backendSrv: BackendSrv): backendSrv is ModernBackendSrv {
  // The existence of this function is sufficient.
  return 'resolveCancelerIfExists' in backendSrv;
}

export function cancelRequest(requestId: string) {
  const backendSrv = getBackendSrv();
  if (isModernBackendSrv(backendSrv)) {
    // Use the direct method if we can.
    backendSrv.resolveCancelerIfExists(requestId);
  } else {
    // This else case is to consider older Grafanas which might not have
    // a `resolveCancelerIfExists` on the service.
    // TODO: Investigate when this method was added, and determine if it's reasonable to remove this else case
    // Otherwise, use this awkward hack.
    // By fetching with the same requestId, previous requestId requests
    // will be cancelled by the backend service. The url does not matter.
    const observable = getBackendSrv().fetch({
      url: '/public/plugins/grafana-pyroscope-app/empty.json',
      requestId,
    });
    lastValueFrom(observable).then(noOp).catch(noOp);
  }
}

function noOp() {}
