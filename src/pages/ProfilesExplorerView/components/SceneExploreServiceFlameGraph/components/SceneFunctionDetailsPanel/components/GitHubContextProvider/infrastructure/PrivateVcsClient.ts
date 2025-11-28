import { logger } from '@shared/infrastructure/tracking/logger';

import { DataSourceProxyClient } from '../../../../../../../infrastructure/series/http/DataSourceProxyClient';
import { GitSessionCookieManager, gitSessionCookieManager } from './GitSessionCookieManager';

type GetFileResponse = {
  content: string;
  URL: string;
};

type Commit = {
  repositoryUrl: string;
  gitRef: string;
};

type GetCommitResponse = {
  author: {
    avatarURL: string;
    login: string;
  };
  date?: Date;
  message: string;
  sha: string;
  URL: string;
};

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

/**
 * Exposes VCSService endpoints which are protected by token authentication. It
 * implements middleware to try auto-refresh expired tokens. While an
 * auto-refresh is in progress, subsequent requests are queued. Once the token
 * is refreshed, the queued requests will be dispatched using the new token.
 *
 * WARNING: Only one instance of this class should be instantiated because it
 * needs to keep a singleton reference to the `GitSession` cookie. This class
 * will refresh the `GitSession` cookie whenever it expires and multiple
 * instances will cause unexpected errors and race conditions.
 */
export class PrivateVcsClient extends DataSourceProxyClient {
  private sessionManager: GitSessionCookieManager;

  private pendingQueue: Array<(err: Error | undefined) => void>;
  private isRefreshing: boolean;

  /** Time interval where the session should be considered expired. */
  private static readonly BIAS_MS = 5 * 60 * 1000; // 5 minutes

  constructor(options: { dataSourceUid: string }) {
    super(options);

    this.sessionManager = gitSessionCookieManager;
    this.isRefreshing = false;
    this.pendingQueue = [];
  }

  /**
   * Fetches a file from GitHub.
   *
   * @param repositoryUrl A repository url
   * @param gitRef A ref of the file version
   * @param localPath A file path relative to the repository root
   * @returns Base64 encoded file contents.
   */
  async getFile(
    repositoryUrl: string,
    gitRef: string,
    localPath: string,
    rootPath: string,
    functionName: string
  ): Promise<GetFileResponse> {
    const response = await this.postWithRefresh(
      '/vcs.v1.VCSService/GetFile',
      JSON.stringify({
        repositoryURL: repositoryUrl,
        ref: gitRef,
        localPath,
        rootPath,
        functionName,
      })
    );

    return response.json();
  }

  /**
   * Fetches a series of commit metadata (author, date, etc) for a list of
   * commit refs.
   *
   * @param commits A list of commits
   * @returns GitHub commit metadata for the commits
   */
  async getCommits(commits: Commit[]): Promise<GetCommitResponse[]> {
    return await Promise.all(
      commits.map(({ repositoryUrl, gitRef }) => {
        if (!repositoryUrl || !gitRef) {
          return PLACEHOLDER_COMMIT_DATA;
        }

        return this.getCommit(repositoryUrl, gitRef).catch((error) => {
          logger.error(error, {
            info: `Error while fetching commit from repo "${repositoryUrl}" (${gitRef})!'`,
          });

          return PLACEHOLDER_COMMIT_DATA;
        });
      })
    );
  }

  async refresh(): Promise<void> {
    return this.refreshSession();
  }

  /**
   * Gets commit metadata (author, date, etc) for a single commit ref.
   *
   * @param repositoryUrl A repository url
   * @param gitRef A commit ref
   * @returns Metadata for a single GitHub commit.
   */
  private async getCommit(repositoryUrl: string, gitRef: string): Promise<GetCommitResponse> {
    const response = await this.postWithRefresh(
      '/vcs.v1.VCSService/GetCommit',
      JSON.stringify({
        repositoryURL: repositoryUrl,
        ref: gitRef,
      })
    );

    const json = await response.json();
    json.date &&= new Date(json.date);
    return json;
  }

  /**
   * Makes an HTTP POST request. If the session cookie is expired, this method
   * will auto-refresh the session cookie. During this time, all subsequent
   * requests will be queued until the refresh is complete.
   *
   * @param path An API route path
   * @param body Request body contents
   * @returns A promise for the HTTP POST request.
   */
  private async postWithRefresh(path: string, body: string): Promise<Response> {
    // Check if the session is refreshing.
    if (this.isRefreshing) {
      return this.queueRequest(path, body);
    }

    // Check if session is expired.
    if (this.sessionManager.getCookie()?.isUserTokenExpired(PrivateVcsClient.BIAS_MS)) {
      this.isRefreshing = true;

      // Refresh the session.
      try {
        await this.refreshSession();
      } catch (e) {
        this.sessionManager.deleteCookie();
        this.flushQueue(e as Error);
      }

      // Resolve the request that triggered the refresh.
      this.flushQueue();
      this.isRefreshing = false;
    }

    return this.post(path, body);
  }

  /**
   * Makes an HTTP POST request. This method assumes a valid session cookie.
   *
   * @param path An API route path
   * @param body Request body contents
   * @returns A response of the resulting HTTP POST request.
   */
  private async post(path: string, body: string): Promise<Response> {
    return this.fetch(path, {
      method: 'POST',
      body: body,
    });
  }

  /**
   * Exchanges the current session cookie for a new one, then saves the cookie
   * in the session manager.
   */
  private async refreshSession(): Promise<void> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubRefresh', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const body = await response.json();
    this.sessionManager.setCookie(body.cookie);
  }

  /**
   * Queues an HTTP request to the provided path with the provided body. The
   * request will be executed when the queue gets flushed.
   *
   * @param path An API route path
   * @param body Request body contents
   * @returns A response of the resulting HTTP POST request.
   */
  private async queueRequest(path: string, body: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.pendingQueue.push((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.post(path, body));
      });
    });
  }

  /**
   * Flushes a queue of requests in the order in which they were received. If
   * an error occurred while the requests were queued, it is passed to each
   * request callback.
   *
   * This function also resets the internal queue.
   *
   * @param err An optional error
   */
  private flushQueue(err: Error | undefined = undefined) {
    this.pendingQueue.forEach((callback) => callback(err));
    this.pendingQueue = [];
  }
}
