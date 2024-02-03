import React, { useCallback } from 'react';

import { AiPanelError } from '../../../pages/ai/shared/AiPanelError';
import { AiPanelFollowUpForm } from '../../../pages/ai/shared/AiPanelFollowUpForm';
import { AiPanelReply } from '../../../pages/ai/shared/AiPanelReply';
import { LlmReply, useLlmSuggestions } from '../../../pages/ai/shared/hooks/useLlm';

import LoadingSpinner from 'grafana-pyroscope/public/app/ui/LoadingSpinner';

import { CodeInfo } from './CodeContainer';

type SuggestionsContainerProps = {
  codeInfo: CodeInfo;
};

export const SuggestionsContainer = ({ codeInfo }: SuggestionsContainerProps) => {

  const { loading, error, reply } = useLlmSuggestions({
    codeInfo: codeInfo,
  });

  const displayReply = Boolean(reply?.hasStarted || reply?.hasFinished);
  const displayFollowUpForm = !error && Boolean(reply?.hasFinished);
  const onSubmitFollowUpForm = useCallback(
    (event: any, question: string) => {
      const addMessages = reply!.addMessages;
      addMessages([
        {
          role: 'assistant',
          content: reply!.text,
        },
        {
          role: 'user',
          content: question,
        },
      ]);
      console.log('*** question', question);
    },
    [reply]
  );

  return (
    <>
      {error ? <AiPanelError /> : null}
      {loading ? (
        <>
          <LoadingSpinner />
          &nbsp;Optimizing code...
        </>
      ) : null}

      {displayReply ? <AiPanelReply noHighlight reply={reply as LlmReply} /> : null}

      {displayFollowUpForm ? <AiPanelFollowUpForm onSubmit={onSubmitFollowUpForm} /> : null}
    </>
  );
};
