import { displayError } from '@shared/domain/displayStatus';
import React, { useCallback, useState } from 'react';
import { DataSourceProxyClientBuilder } from 'src/pages/ProfilesExplorerView/infrastructure/series/http/DataSourceProxyClientBuilder';

import { VcsClient } from '../../infrastructure/VcsClient';
import { generateNonce } from './domain/generateNonce';
import { githubLogin } from './domain/githubLogin';
import { useGithubSessionCookie } from './domain/useGithubSessionCookie';
import { usePollGitHubPopup } from './domain/usePollGitHubPopup';
import { DEFAULT_GITHUB_CONTEXT, GitHubContext } from './GitHubContext';
import { PrivateVcsClient } from './infrastructure/PrivateVcsClient';

type GitHubContextProviderProps = {
  dataSourceUid: string;
  children: React.ReactNode;
};

export const nonce = generateNonce();

export function GitHubContextProvider({ dataSourceUid, children }: GitHubContextProviderProps) {
  const vcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, VcsClient);
  const privateVcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, PrivateVcsClient);

  const [isLoginInProgress, setIsLoginInProgress] = useState(DEFAULT_GITHUB_CONTEXT.isLoginInProgress);
  const [sessionCookie, setSessionCookie] = useGithubSessionCookie();
  const [externalWindow, setExternalWindow] = useState<Window | null>();

  usePollGitHubPopup({ vcsClient, externalWindow, setExternalWindow, setSessionCookie, nonce });

  // Check if login window is open and toggle the login state accordingly. For
  // example, if the login window IS open and the login state is not
  // "in progress", then update the state to be "in progress".
  const newIsLoginInProgress = externalWindow ? !externalWindow.closed : false;
  if (newIsLoginInProgress !== isLoginInProgress) {
    setIsLoginInProgress(newIsLoginInProgress);
  }

  const login = useCallback(async () => {
    try {
      await githubLogin(vcsClient, privateVcsClient, sessionCookie, externalWindow, setExternalWindow);
    } catch (e) {
      displayError(e, ['Failed to login to GitHub', (e as Error).message]);
    }
  }, [vcsClient, privateVcsClient, sessionCookie, externalWindow]);

  return (
    <GitHubContext.Provider
      value={{
        isLoginInProgress,
        isLoggedIn: Boolean(sessionCookie && !sessionCookie.isUserTokenExpired()),
        isSessionExpired: Boolean(sessionCookie?.isUserTokenExpired()),
        login,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
}
