import { config } from '@grafana/runtime';
import { HttpClient } from '@shared/infrastructure/http/HttpClient';

export class DataSourceProxyClient extends HttpClient {
  constructor(options: { dataSourceUid: string }) {
    const { dataSourceUid } = options;

    let { appUrl, bootData } = config;
    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL(`api/datasources/proxy/uid/${dataSourceUid}`, appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
      'X-Grafana-Org-Id': String(bootData?.user?.orgId || ''),
    });
  }
}
