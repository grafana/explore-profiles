import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useMemo, useState } from 'react';

import { useGitHubContext } from '../../../../../../../shared/components/GitHubContextProvider/useGitHubContext';
import { FunctionDetails } from '../../../types/FunctionDetails';
import { useFetchVCSFile } from '../infrastructure/useFetchVCSFile';
import { buildGithubUrlForFunction } from './buildGithubUrlForFunction';
import { buildLineProfiles, buildPlaceholderLineProfiles } from './buildLineProfiles';

export function useCodeContainer(functionDetails: FunctionDetails): DomainHookReturnValue {
  const { isLoggedIn } = useGitHubContext();
  const { version } = functionDetails;

  const [openAiSuggestions, setOpenAiSuggestions] = useState<boolean>(false);

  const {
    fileInfo,
    error: fetchError,
    isFetching,
  } = useFetchVCSFile({
    enabled: isLoggedIn,
    path: functionDetails.fileName,
    repository: version?.repository ?? '',
    gitRef: version?.git_ref ?? '',
  });

  // might be a bit costly so we memoize it
  const lines = useMemo(
    () =>
      fileInfo?.content
        ? buildLineProfiles(fileInfo.content, functionDetails.callSites)
        : buildPlaceholderLineProfiles(functionDetails.callSites),
    [fileInfo?.content, functionDetails.callSites]
  );

  return {
    data: {
      fetchError,
      openAiSuggestions,
      isLoadingCode: isFetching,
      unit: functionDetails.unit,
      githubUrl: fileInfo?.URL ? buildGithubUrlForFunction(fileInfo.URL, functionDetails.startLine) : undefined,
      lines,
      noCodeAvailable: Boolean(fetchError) || !lines.length,
    },
    actions: {
      setOpenAiSuggestions,
    },
  };
}
