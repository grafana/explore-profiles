import { displayError } from '@shared/domain/displayStatus';
import React, { useCallback, useState } from 'react';

import { generateNonce } from './domain/generateNonce';
import { githubLogin } from './domain/githubLogin';
import { useGithubSessionCookie } from './domain/useGithubSessionCookie';
import { usePollGitHubPopup } from './domain/usePollGitHubPopup';
import { DEFAULT_GITHUB_CONTEXT, GitHubContext } from './GitHubContext';

type GitHubContextProviderProps = {
  children: React.ReactNode;
};

export const nonce = generateNonce();

export function GitHubContextProvider({ children }: GitHubContextProviderProps) {
  const [isLoginInProgress, setIsLoginInProgress] = useState(DEFAULT_GITHUB_CONTEXT.isLoginInProgress);
  const [sessionCookie, setSessionCookie] = useGithubSessionCookie();
  const [externalWindow, setExternalWindow] = useState<Window | null>();

  usePollGitHubPopup({ externalWindow, setExternalWindow, setSessionCookie, nonce });

  // Check if login window is open and toggle the login state accordingly. For
  // example, if the login window IS open and the login state is not
  // "in progress", then update the state to be "in progress".
  const newIsLoginInProgress = externalWindow ? !externalWindow.closed : false;
  if (newIsLoginInProgress !== isLoginInProgress) {
    setIsLoginInProgress(newIsLoginInProgress);
  }

  const login = useCallback(async () => {
    try {
      await githubLogin(sessionCookie, externalWindow, setExternalWindow);
    } catch (e) {
      displayError(e, ['Failed to login to GitHub', (e as Error).message]);
    }
  }, [sessionCookie, externalWindow, setExternalWindow]);

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
