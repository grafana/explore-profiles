import { ApiClient } from '../../../../../shared/infrastructure/http/ApiClient';
import { Commit } from '../types/FunctionDetails';

type GithubLoginResponse = {
  cookie: string;
};

type GetFileResponse = {
  content: string;
  URL: string;
};

type GetCommitResponse = Commit;

export const PLACEHOLDER_COMMIT_DATA = Object.freeze({
  sha: '<unknown>',
  date: undefined,
  author: {
    login: 'unknown author',
    avatarURL: '',
  },
  message: '',
  URL: '',
});

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

  async getFile(repositoryUrl: string, gitRef: string, localPath: string): Promise<GetFileResponse> {
    const response = await this.fetch('/vcs.v1.VCSService/GetFile', {
      method: 'POST',
      body: JSON.stringify({
        repositoryURL: repositoryUrl,
        ref: gitRef,
        localPath,
      }),
    });

    return response.json();
  }

  async isSessionExpired(): Promise<boolean> {
    try {
      await this.fetch('/vcs.v1.VCSService/GetFile', {
        method: 'POST',
        body: JSON.stringify({
          repositoryURL: 'https://github.com/grafana/pyroscope',
          ref: 'HEAD',
          localPath: 'README.md',
        }),
      });

      return false;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return true;
      }

      throw error;
    }
  }

  async getCommit(repositoryUrl: string, gitRef: string): Promise<GetCommitResponse> {
    const response = await this.fetch('/vcs.v1.VCSService/GetCommit', {
      method: 'POST',
      body: JSON.stringify({
        repositoryURL: repositoryUrl,
        ref: gitRef,
      }),
    });

    const json = await response.json();

    json.date &&= new Date(json.date);

    return json;
  }

  async getCommits(commits: Array<{ repositoryUrl: string; gitRef: string }>): Promise<GetCommitResponse[]> {
    const responses = await Promise.all(
      commits.map(({ repositoryUrl, gitRef }) => {
        if (!repositoryUrl || !gitRef) {
          return PLACEHOLDER_COMMIT_DATA;
        }

        return this.getCommit(repositoryUrl, gitRef).catch((error) => {
          console.error('Error while fetching commit from repo "%s" (%s)!', repositoryUrl, gitRef);
          console.error(error);

          return PLACEHOLDER_COMMIT_DATA;
        });
      })
    );

    return responses;
  }
}

export const vcsClient = new VcsClient();
