import { getBackendSrv } from '@grafana/runtime';
import { Result } from '@webapp/util/fp';
import {
  type RequestError,
  RequestNotOkError,
  parseResponse,
  RequestAbortedError,
} from '../../../node_modules/pyroscope-oss/webapp/javascript/services/base';

/**
 * request makes requests to the plugin backend
 *
 * It doesn't do request cancellation
 */
export async function request(request: RequestInfo, config?: RequestInit): Promise<Result<unknown, RequestError>> {
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

type BackendSvrError = {
  status: number;
  data: object;
  statusText: string;
};
function isBackendSvrError(error: unknown): error is BackendSvrError {
  return typeof error === 'object' && error !== null && 'statusText' in error && 'data' in error && 'status' in error;
}

export { parseResponse, RequestError, RequestAbortedError };
