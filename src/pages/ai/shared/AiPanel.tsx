import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import LoadingSpinner from 'grafana-pyroscope/public/app/ui/LoadingSpinner';
import React, { useCallback } from 'react';

import { AiPanelError } from './AiPanelError';
import { AiPanelFollowUpForm } from './AiPanelFollowUpForm';
import { AiPanelHeader } from './AiPanelHeader';
import { AiPanelReply } from './AiPanelReply';
import { LlmReply, useLlm } from './hooks/useLlm';

type AiPanelProps = {
  query: string;
  from: string;
  until: string;
  rightQuery?: string;
  rightFrom?: string;
  rightUntil?: string;
  onClickClose: (event: any) => void;
};

// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  panel: css`
    padding: 0 80px 0 16px;

    & h1 {
      margin-top: 0;
    }

    & h2 {
      margin-top: 0;
      font-size: 16px;
      font-weight: bold;
    }
  `,
});

export default function AiPanel({ query, from, until, rightQuery, rightFrom, rightUntil, onClickClose }: AiPanelProps) {
  const styles = useStyles2(getStyles);

  const { loading, error, reply } = useLlm(query, from, until, rightQuery, rightFrom, rightUntil);

  const displayReply = Boolean(reply?.hasStarted || reply?.hasFinished);

  const displayFollowUpForm = !error && Boolean(reply?.hasFinished);
  const onSubmitFollowUpForm = useCallback(
    (question: string) => {
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
    <div className={styles.panel}>
      <AiPanelHeader onClickClose={onClickClose} />

      {error ? <AiPanelError /> : null}
      {loading ? (
        <>
          <LoadingSpinner />
          &nbsp;Analyzing flamegraph...
        </>
      ) : null}

      {displayReply ? <AiPanelReply reply={reply as LlmReply} /> : null}

      {displayFollowUpForm ? <AiPanelFollowUpForm onSubmit={onSubmitFollowUpForm} /> : null}
    </div>
  );
}
