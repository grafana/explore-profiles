import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useMemo, useState } from 'react';

import { FunctionDetails, LineProfile } from '../../../domain/types/FunctionDetails';
import { useGitHubContext } from '../../GitHubContextProvider/useGitHubContext';
import { useFetchVCSFile } from '../infrastructure/useFetchVCSFile';
import { buildGithubUrlForFunction } from './buildGithubUrlForFunction';
import { buildLineProfiles, buildPlaceholderLineProfiles } from './buildLineProfiles';

type CodeContainerDomainValue = DomainHookReturnValue & { data: { lines: LineProfile[] } };

export function useCodeContainer(dataSourceUid: string, functionDetails: FunctionDetails): CodeContainerDomainValue {
  const { isLoggedIn } = useGitHubContext();
  const { version } = functionDetails;

  const [openAiSuggestions, setOpenAiSuggestions] = useState<boolean>(false);

  const {
    fileInfo,
    error: fetchError,
    isFetching,
  } = useFetchVCSFile({
    enabled: isLoggedIn,
    dataSourceUid,
    localPath: functionDetails.fileName,
    repository: version?.repository ?? '',
    gitRef: version?.git_ref ?? '',
    rootPath: version?.root_path ?? '',
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
      noCodeAvailable: Boolean(fetchError) || !lines.some((line) => line.line),
    },
    actions: {
      setOpenAiSuggestions,
    },
  };
}
