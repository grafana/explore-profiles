import { config } from '@grafana/runtime';

import { HttpClient } from '../../../shared/infrastructure/HttpClient';

class PyroscopeApiClient extends HttpClient {
  constructor() {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // to ensure that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL('api/plugins/grafana-pyroscope-app/resources', appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
    });
  }
}

export const pyroscopeApiClient = new PyroscopeApiClient();
