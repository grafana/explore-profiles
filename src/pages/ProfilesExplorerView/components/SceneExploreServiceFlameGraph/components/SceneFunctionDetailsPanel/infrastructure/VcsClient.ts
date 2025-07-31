import { GithubAppResponse } from '@shared/pyroscope-api/vcs/v1/vcs_pb';

import { DataSourceProxyClient } from '../../../../../infrastructure/series/http/DataSourceProxyClient';

type GithubLoginResponse = {
  cookie: string;
};

export class VcsClient extends DataSourceProxyClient {
  async githubLogin(authorizationCode: string): Promise<GithubLoginResponse> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubLogin', {
      method: 'POST',
      body: JSON.stringify({
        authorizationCode,
      }),
    });

    const json = await response.json();

    return json;
  }

  async githubApp(): Promise<GithubAppResponse> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubApp', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const json = await response.json();

    return json;
  }
}
