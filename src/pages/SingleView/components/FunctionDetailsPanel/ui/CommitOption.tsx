import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { buildUnitFormatter } from '../domain/buildUnitFormatter';
import { formatCommitDate } from '../domain/formatCommitDate';
import { CommitWithSamples } from '../domain/getCommitsWithSamples';
import { getCommitShortMessage, getCommitShortSha } from './CommitSelect';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  `,
  firstLine: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1em;
  `,
  sha: css`
    font-family: monospace;
  `,
  sample: css`
    font-size: 12px;
  `,
  secondLine: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 12px;
    color: ${theme.colors.text.secondary};
  `,
  avatar: css`
    display: inline-block;
    margin-right: 4px;
    border-radius: 50%;
    background: grey;
    width: 16px;
    height: 16px;
  `,
  message: css`
    font-size: 12px;
    color: ${theme.colors.text.secondary};
  `,
});

type CommitOptionProps = {
  commit: CommitWithSamples;
};

export function CommitOption({ commit }: CommitOptionProps) {
  const styles = useStyles2(getStyles);

  const { author, samples } = commit;

  const commitAuthor = author.login;
  const commitAuthorAvatarUrl = author.avatarURL;

  const total = buildUnitFormatter(samples.unit)(samples.current);
  const samplePercent = Math.round((samples.current / samples.total) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.firstLine}>
        <span className={styles.sha}>{getCommitShortSha(commit.sha)}</span>
        <span className={styles.sample}>
          {total.text}
          {total.suffix} ({samplePercent}%)
        </span>
      </div>

      <div className={styles.secondLine}>
        {commitAuthorAvatarUrl && <img className={styles.avatar} src={commitAuthorAvatarUrl} alt={commitAuthor} />}
        <span>
          {commitAuthor} on {formatCommitDate(commit.date)}
        </span>
      </div>

      <span className={styles.message}>{getCommitShortMessage(commit.message)}</span>
    </div>
  );
}
