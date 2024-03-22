import { useGitHubContext } from '@shared/components/GitHubContextProvider/useGitHubContext';
import { displaySuccess } from '@shared/domain/displayStatus';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { userStorage } from '@shared/infrastructure/userStorage';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useMemo, useState } from 'react';

import { useFetchFunctionsDetails } from '../infrastructure/useFetchFunctionsDetails';
import { FunctionDetails } from '../types/FunctionDetails';
import { StackTrace } from '../types/StackTrace';
import { CommitWithSamples, getCommitsWithSamples } from './getCommitsWithSamples';
import { getRepositoryDetails } from './getRepositoryDetails';
import { isGitHubRepository } from './isGitHubRepository';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function useFunctionDetailsPanel(stacktrace: StackTrace): DomainHookReturnValue {
  const [query] = useQueryFromUrl();
  const { profileMetricId, labelsSelector } = parseQuery(query);
  const { isLoggedIn: isGitHubLogged } = useGitHubContext();

  const {
    functionsDetails,
    error: fetchFunctionDetailsError,
    isFetching,
  } = useFetchFunctionsDetails({ profileMetricId, labelsSelector, stacktrace, isGitHubLogged });

  const [prevFunctionsDetails, setPrevFunctionsDetails] = useState<FunctionDetails[]>();
  const [currentFunctionDetails, setCurrentFunctionDetails] = useState<FunctionDetails>(functionsDetails[0]);
  const [isGitHubBannerDismissed, setIsGitHubBannerDismissed] = useState(
    userStorage.has(userStorage.KEYS.GITHUB_INTEGRATION)
  );

  if (functionsDetails && prevFunctionsDetails !== functionsDetails) {
    setPrevFunctionsDetails(functionsDetails);

    if (currentFunctionDetails !== functionsDetails[0]) {
      setCurrentFunctionDetails(functionsDetails[0]);
    }
  }

  const isGitHubRepo = isGitHubRepository(currentFunctionDetails?.version?.repository || '');
  const isGitHubSupported = currentFunctionDetails?.fileName?.endsWith('.go');
  const shouldDisplayGitHubBanner = !isGitHubBannerDismissed && !isGitHubRepo && isGitHubSupported;

  // TODO: massage in useFetchFunctionsDetails?
  const totalSamples = useMemo(
    () =>
      functionsDetails
        .map((details) => Array.from(details.callSites.values()).reduce((acc, { cum }) => acc + cum, 0))
        .reduce((acc, total) => acc + total, 0),
    [functionsDetails]
  );
  const commits = getCommitsWithSamples(functionsDetails, totalSamples);
  const selectedCommit = commits.find(({ sha }) => sha === currentFunctionDetails?.commit?.sha);

  return {
    data: {
      isLoading: isFetching,
      fetchFunctionDetailsError,
      functionDetails: currentFunctionDetails,
      // TODO: massage in useFetchFunctionsDetails?
      repository: getRepositoryDetails(isGitHubRepo, currentFunctionDetails?.version),
      commits,
      selectedCommit,
      isGitHubSupported,
      shouldDisplayGitHubBanner,
    },
    actions: {
      selectCommit(selectedCommit: CommitWithSamples) {
        const details = functionsDetails.find(({ commit }) => commit.sha === selectedCommit.sha);
        setCurrentFunctionDetails(details as FunctionDetails);
      },
      async copyFilePathToClipboard() {
        try {
          if (currentFunctionDetails?.fileName) {
            await navigator.clipboard.writeText(currentFunctionDetails.fileName);
            displaySuccess(['File path copied to clipboard!']);
          }
        } catch {}
      },
      dismissGitHubBanner() {
        userStorage.set(userStorage.KEYS.GITHUB_INTEGRATION, {});
        setIsGitHubBannerDismissed(true);
      },
    },
  };
}
