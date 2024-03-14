import { displayError } from '@shared/domain/displayStatus';
import React, { useCallback, useState } from 'react';

import { vcsClient } from '../../../pages/SingleView/components/FunctionDetailsPanel/infrastructure/vcsClient';
import { generateNonce } from './domain/generateNonce';
import { openLoginPopup } from './domain/openLoginPopup';
import { useGithubSessionCookie } from './domain/useGithubSessionCookie';
import { usePollGitHubPopup } from './domain/usePollGitHubPopup';
import { DEFAULT_GITHUB_CONTEXT, GitHubContext } from './GitHubContext';

type GitHubContextProviderProps = {
  children: React.ReactNode;
};

const nonce = generateNonce();

// eslint-disable-next-line sonarjs/cognitive-complexity
export function GitHubContextProvider({ children }: GitHubContextProviderProps) {
  const [isLoginInProgress, setIsLogInInProgress] = useState(DEFAULT_GITHUB_CONTEXT.isLoginInProgress);
  const [isLoggedIn, setIsLoggedIn] = useState(DEFAULT_GITHUB_CONTEXT.isLoggedIn);

  const [sessionCookie, setSessionCookie] = useGithubSessionCookie();
  const [externalWindow, setExternalWindow] = useState<Window | null>();

  usePollGitHubPopup({ externalWindow, setExternalWindow, setSessionCookie, nonce });

  const newIsLogging = externalWindow ? !externalWindow.closed : false;
  if (newIsLogging !== isLoginInProgress) {
    setIsLogInInProgress(newIsLogging);
  }

  const newIsLoggedIn = Boolean(sessionCookie);
  if (newIsLoggedIn !== isLoggedIn) {
    setIsLoggedIn(newIsLoggedIn);
  }

  const login = useCallback(async () => {
    if (externalWindow) {
      externalWindow.close();
    }

    try {
      const clientId = await vcsClient.githubApp();

      setExternalWindow(openLoginPopup(clientId, nonce));
    } catch (error) {
      displayError(error, ['Error while trying to log in to GitHub!', (error as Error).message]);
    }
  }, [externalWindow]);

  const isSessionExpired = async () => {
    if (!sessionCookie) {
      return false;
    }

    const isExpired = await vcsClient.isSessionExpired().catch(() => false);

    if (isExpired) {
      setSessionCookie('');
    }

    return isExpired;
  };

  return (
    <GitHubContext.Provider
      value={{
        isLoginInProgress,
        isLoggedIn,
        isSessionExpired,
        login,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
}
