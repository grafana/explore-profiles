import { css } from '@emotion/css';
import { Spinner, useStyles2 } from '@grafana/ui';
import { InlineBanner } from '@shared/ui/InlineBanner';
import React from 'react';

import { AiReply } from '../../../../../../components/SceneAiPanel/components/AiReply';
import { FollowUpForm } from '../../../../../../components/SceneAiPanel/components/FollowUpForm';
import { SuggestionPromptInputs } from './domain/buildLlmSuggestionPrompts';
import { useAiSuggestionsPanel } from './domain/useAiSuggestionsPanel';

const getStyles = () => ({
  title: css`
    margin: -4px 0 4px 0;
  `,
  content: css``,
});

type AiSuggestionsPanelProps = {
  suggestionPromptInputs: SuggestionPromptInputs;
};

export function AiSuggestionsPanel({ suggestionPromptInputs }: AiSuggestionsPanelProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useAiSuggestionsPanel(suggestionPromptInputs);

  return (
    <>
      <h6 className={styles.title}>Code Optimization Suggestions</h6>
      <div className={styles.content}>
        {data.isLoading && (
          <>
            <Spinner inline />
            &nbsp;Analyzing...
          </>
        )}

        {data.fetchError && (
          <InlineBanner
            severity="error"
            title="Error while fetching profiles!"
            message="Sorry for any inconvenience, please try again later."
          />
        )}

        {data.llmError && (
          <InlineBanner
            severity="error"
            title="Failed to generate content using OpenAI!"
            error={data.llmError}
            message="Sorry for any inconvenience, please try again later or if the problem persists, contact your organization admin."
          />
        )}

        {data.shouldDisplayReply && <AiReply reply={data.reply} />}

        {data.shouldDisplayFollowUpForm && <FollowUpForm onSubmit={actions.submitFollowupQuestion} />}
      </div>
    </>
  );
}
