import { tenantIDFromStorage } from '@pyroscope/services/storage';
import { HttpClient } from '../../../../../../shared/infrastructure/http/HttpClient';
import { config } from '@grafana/runtime';

export enum ProfileFormat {
  dot = 'dot',
}

export class PyroscopeApiClient extends HttpClient {
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
    return this._post('/querier.v1.QuerierService/LabelNames', {
      matchers: PyroscopeApiClient.queryToMatchers(query),
      start: from,
      end: until,
    }).then((response) => response.json());
  }

  async fetchLabelValues(labelId: string, query: string, from: number, until: number) {
    return this._post('/querier.v1.QuerierService/LabelValues', {
      name: labelId,
      matchers: PyroscopeApiClient.queryToMatchers(query),
      start: from,
      end: until,
    }).then((response) => response.json());
  }

  async fetchProfile(query: string, from: number, until: number, format: ProfileFormat, maxNodes: number) {
    return this._get('/pyroscope/render', {
      query,
      from,
      until,
      format,
      maxNodes,
    }).then((response) => (format === ProfileFormat.dot ? response.text() : response.json()));
  }

  _buildHeaders() {
    const tenantID = tenantIDFromStorage();
    return tenantID ? { 'X-Scope-OrgID': tenantID } : undefined;
  }

  _get(pathname: string, urlSearchParams: Record<string, any>) {
    const params = new URLSearchParams(urlSearchParams);

    return super.fetch(`${pathname}?${params.toString()}`, {
      method: 'GET',
      headers: this._buildHeaders(),
    });
  }

  _post(pathname: string, body: Record<string, any>) {
    return super.fetch(pathname, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: this._buildHeaders(),
    });
  }
}
