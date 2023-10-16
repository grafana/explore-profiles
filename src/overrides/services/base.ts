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

// TODO: bad naming, we should export a simple 'request' function for people consume
// it's irrelevant whether it has OrgID or not, however to fix this it needs to be changed upstream (in phlare repo) first
/**
 * makes a request with faro tracing integration (if enabled)
 */
export async function requestWithOrgID(
  request: RequestInfo,
  config?: RequestInit
): Promise<Result<unknown, RequestError>> {
  const faro = Faro;
  const otel = faro?.api?.getOTEL();
  const tracer = otel?.trace.getTracer('default');

  // Don't do any tracing if disabled
  if (!faro || !otel || !tracer) {
    return requestWithOrgID2(request, config);
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
      const res = await requestWithOrgID2(request, config);

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
 * request makes requests to the plugin backend
 *
 * It doesn't do request cancellation
 */
export async function requestWithOrgID2(
  request: RequestInfo,
  config?: RequestInit
): Promise<Result<unknown, RequestError>> {
  try {
    // Replace any double slashes
    const url = ['api/plugins/grafana-pyroscope-app/resources', request].join('/').replace(/\/{2,}/g, '/');

    // TODO: replace with fetch since this is going to be deprecated
    const response = await getBackendSrv().request({
      method: config?.method,
      url,
      data: config?.body,
    });

    return Result.ok(response);
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
