import { AiSuggestionsPanel } from '@shared/components/AiSuggestionsPanel/AiSuggestionsPanel';
import { displayError } from '@shared/domain/displayStatus';
import { HttpClientError } from '@shared/infrastructure/http/HttpClientError';
import React from 'react';

import { FunctionDetails } from '../../types/FunctionDetails';
import { useCodeContainer } from './domain/useCodeContainer';
import { Code } from './ui/Code';

type CodeContainerProps = {
  functionDetails: FunctionDetails;
};

export function CodeContainer({ functionDetails }: CodeContainerProps) {
  const { data, actions } = useCodeContainer(functionDetails);

  if (data.fetchError && (data.fetchError as HttpClientError)?.response?.status !== 404) {
    displayError(data.fetchError, ['Failed to fetch file information!', (data.fetchError as Error).message]);
  }

  return (
    <>
      <Code
        lines={data.lines}
        unit={data.unit}
        githubUrl={data.githubUrl}
        isLoadingCode={data.isLoadingCode}
        noCodeAvailable={data.noCodeAvailable}
        onOptimizeCodeClick={() => {
          actions.setOpenAiSuggestions(true);
          document.getElementById('ai-suggestions-panel')?.scrollIntoView({
            behavior: 'smooth',
          });
        }}
      />
      <h6 id="ai-suggestions-panel" style={{ height: 0, marginBottom: 0 }}></h6>
      {data.openAiSuggestions ? (
        <AiSuggestionsPanel
          suggestionPromptInputs={{
            functionDetails: functionDetails,
            lines: data.lines,
          }}
        />
      ) : null}
    </>
  );
}
