import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, Spinner, useStyles2 } from '@grafana/ui';
import { Panel } from '@shared/components/Panel';
import React from 'react';

import { InlineBanner } from '../InlineBanner';
import { AiReply } from './components/AiReply';
import { FollowUpForm } from './components/FollowUpForm';
import { useAiPanel } from './domain/useAiPanel';

const getStyles = (theme: GrafanaTheme2) => ({
  title: css`
    margin: -4px 0 4px 0;
  `,
  content: css`
    padding: ${theme.spacing(1)};
  `,
});

type AiPanelProps = {
  className: string;
  onClose: () => void;
  isDiff?: boolean;
};

export function AiPanel({ className, onClose, isDiff }: AiPanelProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useAiPanel(isDiff);

  return (
    <Panel
      className={className}
      isLoading={data.isLoading}
      headerActions={
        <IconButton title="Close panel" name="times-circle" variant="secondary" aria-label="close" onClick={onClose} />
      }
      dataTestId="ai-panel"
    >
      <h1 className={styles.title}>AI flame graph analysis</h1>

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
            errors={[data.llmError]}
            message="Sorry for any inconvenience, please try again later or if the problem persists, contact your organization admin."
          />
        )}

        {data.shouldDisplayReply && <AiReply reply={data.reply} />}

        {data.shouldDisplayFollowUpForm && <FollowUpForm onSubmit={actions.submitFollowupQuestion} />}
      </div>
    </Panel>
  );
}
