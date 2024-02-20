import { ApiClient } from '@shared/infrastructure/http/ApiClient';

export enum ProfileFormat {
  dot = 'dot',
}

export class ProfileApiClient extends ApiClient {
  async fetchProfile(query: string, from: number, until: number, format: ProfileFormat, maxNodes: number) {
    return this._get('/pyroscope/render', {
      query,
      from,
      until,
      format,
      maxNodes,
    }).then((response) => (format === ProfileFormat.dot ? response.text() : response.json()));
  }

  _get(pathname: string, urlSearchParams: Record<string, any>) {
    const params = new URLSearchParams(urlSearchParams);

    return super.fetch(`${pathname}?${params.toString()}`, {
      method: 'GET',
    });
  }
}
