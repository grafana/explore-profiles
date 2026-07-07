import { css } from '@emotion/css';
import { t, Trans } from '@grafana/i18n';
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
      <h6 className={styles.title}>
        <Trans i18nKey="function-details.ai-suggestions.title">Code Optimization Suggestions</Trans>
      </h6>
      <div className={styles.content}>
        {data.isLoading && (
          <>
            <Spinner inline />
            &nbsp;<Trans i18nKey="function-details.ai-suggestions.analyzing">Analyzing...</Trans>
          </>
        )}

        {data.fetchError && (
          <InlineBanner
            severity="error"
            title={t('function-details.ai-suggestions.fetch-error', 'Error while fetching profiles!')}
            message={t(
              'function-details.ai-suggestions.fetch-error-message',
              'Sorry for any inconvenience, please try again later.'
            )}
          />
        )}

        {data.llmError && (
          <InlineBanner
            severity="error"
            title={t('function-details.ai-suggestions.llm-error', 'Failed to generate content using OpenAI!')}
            error={data.llmError}
            message={t(
              'function-details.ai-suggestions.llm-error-message',
              'Sorry for any inconvenience, please try again later or if the problem persists, contact your organization admin.'
            )}
          />
        )}

        {data.shouldDisplayReply && <AiReply reply={data.reply} />}

        {data.shouldDisplayFollowUpForm && <FollowUpForm onSubmit={actions.submitFollowupQuestion} />}
      </div>
    </>
  );
}
