import { useContext } from 'react';

import { GitHubContext, TGitHubContext } from './GitHubContext';

export function useGitHubContext(): TGitHubContext {
  return useContext(GitHubContext);
}
