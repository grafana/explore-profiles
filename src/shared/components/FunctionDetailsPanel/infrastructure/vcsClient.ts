import { ApiClient } from '@shared/infrastructure/http/ApiClient';

type GithubLoginResponse = {
  cookie: string;
};

class VcsClient extends ApiClient {
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

  // TODO: return json + rename?
  async githubApp(): Promise<string> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubApp', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const json = await response.json();

    return json.clientID;
  }
}

export const vcsClient = new VcsClient();