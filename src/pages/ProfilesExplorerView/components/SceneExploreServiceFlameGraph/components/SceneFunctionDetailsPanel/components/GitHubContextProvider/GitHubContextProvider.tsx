import { displayError } from '@shared/domain/displayStatus';
import React, { useCallback, useEffect, useState } from 'react';
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

// Keep the data source UID in session storage to reuse it if the page is refreshed
const SESSION_DATA_SOURCE_KEY = `grafana-pyroscope-app.gitHubIntegration.dataSourceUid`;

export function GitHubContextProvider({ dataSourceUid, children }: GitHubContextProviderProps) {
  const vcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, VcsClient);
  const privateVcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, PrivateVcsClient);

  const [isLoginInProgress, setIsLoginInProgress] = useState(DEFAULT_GITHUB_CONTEXT.isLoginInProgress);
  const [sessionCookie, setSessionCookie] = useGithubSessionCookie();
  const [externalWindow, setExternalWindow] = useState<Window | null>();

  // hack to prevent failures impossible to fix for the user (unless they know they have to delete the cookie)
  // when logged in and changing data source
  // TODO: provide a better way
  useEffect(() => {
    const gitHubIntegrationDataSourceUid = sessionStorage.getItem(SESSION_DATA_SOURCE_KEY);
    if (gitHubIntegrationDataSourceUid !== dataSourceUid) {
      setSessionCookie('');
      sessionStorage.setItem(SESSION_DATA_SOURCE_KEY, dataSourceUid || '');
    }
  }, [dataSourceUid]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch (error) {
      displayError(error as Error, ['Failed to login to GitHub', (error as Error).message]);
    }
  }, [vcsClient, privateVcsClient, sessionCookie, externalWindow]);

  return (
    <GitHubContext.Provider
      value={{
        isLoginInProgress,
        isLoggedIn: Boolean(sessionCookie && !sessionCookie.isUserTokenExpired()),
        isSessionExpired: Boolean(sessionCookie?.isUserTokenExpired()),
        login,
        logout: () => setSessionCookie(''),
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
}
