import { displayError } from '@shared/domain/displayStatus';
import { HttpClientError } from '@shared/infrastructure/http/HttpClient';
import React from 'react';

import { FunctionDetails } from '../../types/FunctionDetails';
import { useCodeContainer } from './domain/useCodeContainer';
import { Code } from './ui/Code';

type CodeContainerProps = {
  functionDetails: FunctionDetails;
};

export function CodeContainer({ functionDetails }: CodeContainerProps) {
  const { data } = useCodeContainer(functionDetails);

  if (data.fetchError && (data.fetchError as HttpClientError)?.response?.status !== 404) {
    displayError(data.fetchError, ['Failed to fetch file information!', (data.fetchError as Error).message]);
  }

  return (
    <Code
      lines={data.lines}
      unit={data.unit}
      githubUrl={data.githubUrl}
      isLoadingCode={data.isLoadingCode}
      noCodeAvailable={data.noCodeAvailable}
    />
  );
}
