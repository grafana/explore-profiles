import { createContext } from 'react';

export type TGitHubContext = {
  isLoggedIn: boolean;
  isSessionExpired: boolean;
  isLoginInProgress: boolean;
  login: () => Promise<void>;
};

export const DEFAULT_GITHUB_CONTEXT: TGitHubContext = {
  isLoginInProgress: false,
  isLoggedIn: false,
  isSessionExpired: false,
  login: async () => {},
};

export const GitHubContext = createContext(DEFAULT_GITHUB_CONTEXT);
