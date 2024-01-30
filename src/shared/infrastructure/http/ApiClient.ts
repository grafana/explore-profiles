import { config } from '@grafana/runtime';

import { HttpClient } from './HttpClient';

/**
 * An HTTP client ready to fetch data from the plugin's backend
 */
export class ApiClient extends HttpClient {
  constructor() {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL('api/plugins/grafana-pyroscope-app/resources', appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
    });
  }
}
