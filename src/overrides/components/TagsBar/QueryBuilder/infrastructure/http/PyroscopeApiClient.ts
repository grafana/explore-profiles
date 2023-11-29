import { tenantIDFromStorage } from '@pyroscope/services/storage';
import { HttpClient } from './HttpClient';
import { config } from '@grafana/runtime';

export class PyroscopeApiClient extends HttpClient {
  constructor() {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // to ensure that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL('api/plugins/grafana-pyroscope-app/resources/querier.v1.QuerierService', appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
    });
  }

  static queryToMatchers(query: string) {
    const labelsIndex = query.indexOf('{');

    if (labelsIndex > 0) {
      const profileTypeID = query.substring(0, labelsIndex);
      return [`{__profile_type__=\"${profileTypeID}\", ${query.substring(labelsIndex + 1, query.length)}`];
    }

    if (labelsIndex === 0) {
      return [query];
    }

    return [`{__profile_type__=\"${query}\"}`];
  }

  async fetchLabels(query: string, from: number, until: number) {
    return this._post('/LabelNames', {
      matchers: PyroscopeApiClient.queryToMatchers(query),
      start: from,
      end: until,
    });
  }

  async fetchLabelValues(labelId: string, query: string, from: number, until: number) {
    return this._post('/LabelValues', {
      name: labelId,
      matchers: PyroscopeApiClient.queryToMatchers(query),
      start: from,
      end: until,
    });
  }

  _post(pathname: string, body: Record<string, any>) {
    const tenantID = tenantIDFromStorage();
    const headers = tenantID ? { 'X-Scope-OrgID': tenantID } : undefined;

    return super.fetch(pathname, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }
}
