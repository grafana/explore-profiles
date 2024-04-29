import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, IconButton, Spinner, useStyles2 } from '@grafana/ui';
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
  retryButton: css`
    float: right;
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
      title="Flame graph analysis"
      isLoading={data.isLoading}
      headerActions={
        <IconButton title="Close panel" name="times-circle" variant="secondary" aria-label="close" onClick={onClose} />
      }
      dataTestId="ai-panel"
    >
      <div className={styles.content}>
        {data.fetchError && (
          <InlineBanner
            severity="error"
            title="Error while fetching profiles!"
            message="Sorry for any inconvenience, please try again later."
          />
        )}

        {data.shouldDisplayReply && <AiReply reply={data.reply} />}

        {data.isLoading && (
          <>
            <Spinner inline />
            &nbsp;Analyzing...
          </>
        )}

        {data.llmError && (
          <Alert title="An error occured while generating content using OpenAI!" severity="warning">
            <div>
              <div>
                <p>{data.llmError.message}</p>
                <p>
                  Sorry for any inconvenience, please retry or if the problem persists, contact your organization admin.
                </p>
              </div>
            </div>
            <Button className={styles.retryButton} variant="secondary" fill="outline" onClick={() => actions.retry()}>
              Retry
            </Button>
          </Alert>
        )}

        {data.shouldDisplayFollowUpForm && <FollowUpForm onSubmit={actions.submitFollowupQuestion} />}
      </div>
    </Panel>
  );
}
