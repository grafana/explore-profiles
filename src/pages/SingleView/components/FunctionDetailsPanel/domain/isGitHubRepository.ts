export const GITHUB_URL = 'https://github.com/';

export const isGitHubRepository = (repositoryUrl: string): boolean => repositoryUrl.startsWith(GITHUB_URL);
