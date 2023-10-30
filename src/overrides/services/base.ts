import { getBackendSrv } from '@grafana/runtime';
import { Result } from '@pyroscope/util/fp';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { SpanStatusCode } from '@opentelemetry/api';
import {
  type RequestError,
  RequestNotOkError,
  parseResponse,
  RequestAbortedError,
  request,
} from '../../../node_modules/grafana-pyroscope/public/app/services/base';
import { faro as Faro } from '../../utils/faro';
import { firstValueFrom } from 'rxjs';

// TODO: 
// Move various functions into /utils/backend, but ensure the expected override exports
// are still exported from here.
import backendFetch from '../../utils/backend/fetch';

// TODO: re: `requestWithOrgID`, we should export a simple 'request' function
// however to fix this it needs to be changed upstream (in grafana/pyroscope repo) first.
// Also note that grafana/pyroscope repo also has a simple 'request' so we may need to resolve to a single
// function first.
/**
 * makes a request with faro tracing integration (if enabled)
 */
export async function requestWithOrgID(
  request: RequestInfo,
  config?: RequestInit
): Promise<Result<unknown, RequestError>> {

  // TODO move aspects of this code into:
  // /utils/backend/telemetry
  const faro = Faro;
  const otel = faro?.api?.getOTEL();
  const tracer = otel?.trace.getTracer('default');

  // Don't do any tracing if disabled
  if (!faro || !otel || !tracer) {
    return requestWrapper(request, config);
  }

  let span = otel.trace.getActiveSpan();
  if (!span) {
    span = tracer.startSpan('http-request');
    span.setAttribute('page_url', document.URL.split('//')[1]);
    span.setAttribute(SemanticAttributes.HTTP_URL, request.toString());
    span.setAttribute(SemanticAttributes.HTTP_METHOD, config?.method || 'GET');
  }

  // Notice how we always resolve even in error cases
  // The services distinguish based on the Result type
  return new Promise((resolve) => {
    otel.context.with(otel.trace.setSpan(otel.context.active(), span!), async () => {
      const url = request.toString();
      faro.api.pushEvent('Sending request', { url });
      const res = await requestWrapper(request, config);

      if (res.isErr) {
        span!.setStatus({ code: SpanStatusCode.ERROR });
        faro.api.pushEvent('Request failed', { url });
        faro.api.pushError(res.error);
      } else {
        faro.api.pushEvent('Request completed', { url });
      }
      span!.end();

      resolve(res);
    });
  });
}

/**
 * Makes requests to the plugin backend
 */
export async function requestWrapper(
  requestInfo: RequestInfo,
  config?: RequestInit
): Promise<Result<unknown, RequestError>> {
  try {
    // Prepend plugin resources proxy URL and replace any double slashes
    const url = ['api/plugins/grafana-pyroscope-app/resources', requestInfo].join('/').replace(/\/{2,}/g, '/');
    
    const response = await backendFetch(url, config);
    return Result.ok(response.data);
  } catch (e) {
    if (isBackendSvrError(e)) {
      return Result.err(new RequestNotOkError(e.status, `${e.statusText}:  ${JSON.stringify(e.data)}`));
    }
    return Result.err(new RequestNotOkError(500, JSON.stringify(e)));
  }
}

export async function downloadWithOrgID(
  request: RequestInfo,
  config?: RequestInit
): Promise<Result<Response, RequestError>> {
  try {
    // Replace any double slashes
    const url = ['api/plugins/grafana-pyroscope-app/resources', request].join('/').replace(/\/{2,}/g, '/');

    const response = getBackendSrv().fetch<Blob>({
      responseType: 'blob',
      method: config?.method,
      url,
      // TODO: not really safe here, the interface should not be as broad to allow things that are not possible to put
      // in Blob
      data: new Blob([config?.body as Uint8Array]),
      headers: config?.headers,
    });
    const blob = await firstValueFrom(response);
    return Result.ok(new Response(blob.data));
  } catch (e) {
    if (isBackendSvrError(e)) {
      return Result.err(new RequestNotOkError(e.status, `${e.statusText}:  ${JSON.stringify(e.data)}`));
    }
    return Result.err(new RequestNotOkError(500, JSON.stringify(e)));
  }
}

type BackendSvrError = {
  status: number;
  data: object;
  statusText: string;
};
function isBackendSvrError(error: unknown): error is BackendSvrError {
  return typeof error === 'object' && error !== null && 'statusText' in error && 'data' in error && 'status' in error;
}

export { parseResponse, request, RequestError, RequestNotOkError, RequestAbortedError };
