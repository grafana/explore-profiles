import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
// import React, { useCallback } from 'react';
import React from 'react';
import LoadingSpinner from 'grafana-pyroscope/public/app/ui/LoadingSpinner';
import { AiPanelError } from './AiPanelError';
// import { AiPanelFollowUpForm } from './AiPanelFollowUpForm';
import { AiPanelHeader } from './AiPanelHeader';
import { AiPanelReply } from './AiPanelReply';
import { LlmReply, useLlm } from './hooks/useLlm';

type AiPanelProps = {
  query: string;
  from: string;
  until: string;
  onClickClose: (event: any) => void;
};

// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  panel: css`
    padding: 0 16px;

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

export default function AiPanel({ query, from, until, onClickClose }: AiPanelProps) {
  const styles = useStyles2(getStyles);

  const { loading, error, reply } = useLlm(query, from, until);

  const displayReply = Boolean(reply?.hasStarted || reply?.hasFinished);

  // const displayFollowUpForm = !error && Boolean(reply?.hasFinished);
  // const onSubmitFollowUpForm = useCallback((event: any, question: string) => {
  //   // TODO
  //   console.log('*** question', question);
  // }, []);

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

      {/* {displayFollowUpForm ? <AiPanelFollowUpForm onSubmit={onSubmitFollowUpForm} /> : null} */}
    </div>
  );
}
