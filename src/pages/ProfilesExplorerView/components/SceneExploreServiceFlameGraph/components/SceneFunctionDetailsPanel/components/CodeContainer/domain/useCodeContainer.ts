import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useMemo, useState } from 'react';

import { FunctionDetails, LineProfile } from '../../../domain/types/FunctionDetails';
import { useGitHubContext } from '../../GitHubContextProvider/useGitHubContext';
import { useFetchVCSFile } from '../infrastructure/useFetchVCSFile';
import { buildGithubUrlForFunction } from './buildGithubUrlForFunction';
import { annotateLines, annotatePlaceholderLineProfiles } from './buildLineProfiles';

/**
 * View model for Code component
 */
export type CodeLine = LineProfile & { line: string };

type CodeContainerDomainValue = DomainHookReturnValue & { data: { snippetLines: CodeLine[]; allLines: CodeLine[] } };

// eslint-disable-next-line sonarjs/cognitive-complexity
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
  const { snippetLines, lines } = useMemo(() => {
    const [snippetLines, lines] = fileInfo?.content
      ? annotateLines(fileInfo.content, functionDetails.callSites)
      : annotatePlaceholderLineProfiles(functionDetails.callSites);

    return {
      snippetLines,
      lines,
    };
  }, [fileInfo?.content, functionDetails.callSites]);

  return {
    data: {
      fetchError,
      openAiSuggestions,
      isLoadingCode: isFetching,
      unit: functionDetails.unit,
      githubUrl: fileInfo?.URL ? buildGithubUrlForFunction(fileInfo.URL, functionDetails.startLine) : undefined,
      snippetLines: snippetLines.map((annotatedLine) => ({ ...annotatedLine, line: annotatedLine.line ?? '???' })),
      allLines: lines.map((annotateLine) => ({ ...annotateLine, line: annotateLine.line ?? '???' })),
      noCodeAvailable: Boolean(fetchError) || !lines.some((line) => line.line),
    },
    actions: {
      setOpenAiSuggestions,
    },
  };
}
