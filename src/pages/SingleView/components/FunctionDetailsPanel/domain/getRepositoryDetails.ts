import { FunctionVersion } from '../types/FunctionDetails';
import { GITHUB_URL } from './isGitHubRepository';

export function getRepositoryDetails(isGitHub: boolean, functionVersion?: FunctionVersion) {
  if (!functionVersion?.repository) {
    return null;
  }

  const url = functionVersion.repository;
  const name = url.replace(GITHUB_URL, '');
  const gitRef = functionVersion.git_ref;

  return {
    isGitHub,
    url,
    name,
    commitUrl: gitRef ? `${url}/commit/${gitRef}` : url,
    commitName: gitRef ? `${name}@${gitRef.substring(0, 7)}` : name,
  };
}
