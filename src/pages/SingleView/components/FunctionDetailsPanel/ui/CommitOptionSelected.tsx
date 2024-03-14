import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { Commit } from '../types/FunctionDetails';
import { getCommitShortMessage, getCommitShortSha } from './CommitSelect';

const getStyles = () => ({
  container: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 1em;
  `,
  sha: css`
    font-family: monospace;
  `,
  message: css`
    color: grey;
  `,
});

type CommitOptionSelectedProps = {
  commit: Commit;
};

export function CommitOptionSelected({ commit }: CommitOptionSelectedProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <span className={styles.sha}>{getCommitShortSha(commit.sha)}</span>
      <div className={styles.message}>
        <span>{getCommitShortMessage(commit.message)}</span>
      </div>
    </div>
  );
}
