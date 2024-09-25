import { config } from '@grafana/runtime';
import { HttpClient } from '@shared/infrastructure/http/HttpClient';

export class DataSourceProxyClient extends HttpClient {
  dataSourceUid: string;

  constructor(options: { dataSourceUid: string }) {
    const { dataSourceUid } = options;

    let { appSubUrl = '', bootData } = config;
    if (appSubUrl?.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appSubUrl += '/';
    }

    super(`${appSubUrl}api/datasources/proxy/uid/${dataSourceUid}`, {
      'content-type': 'application/json',
      'X-Grafana-Org-Id': String(bootData?.user?.orgId || ''),
    });

    this.dataSourceUid = options.dataSourceUid;
  }
}
