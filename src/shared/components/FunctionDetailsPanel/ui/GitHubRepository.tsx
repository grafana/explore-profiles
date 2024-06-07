import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Spinner, useStyles2 } from '@grafana/ui';
import { useGitHubContext } from '@shared/components/GitHubContextProvider/useGitHubContext';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  ellipsis: css`
    color: ${theme.colors.primary.text};
    text-overflow: ellipsis;
    overflow: hidden;
    direction: rtl;
    white-space: nowrap;
  `,
});

type GitHubRepositoryProps = {
  enableIntegration: boolean;
  repository: {
    name: string;
    commitUrl: string;
    commitName: string;
  };
};

export const GitHubRepository = ({ enableIntegration, repository }: GitHubRepositoryProps) => {
  const styles = useStyles2(getStyles);
  const { isLoginInProgress, isLoggedIn, login } = useGitHubContext();

  if (!enableIntegration) {
    return <>-</>;
  }

  // enableIntegration=true
  if (isLoginInProgress) {
    return (
      <>
        <Spinner />
        <span>Connecting to GitHub...</span>
      </>
    );
  }

  // enableIntegration=true, isLoginInProgress=false
  if (!isLoggedIn) {
    return (
      <LinkButton icon="github" variant="primary" onClick={login}>
        Connect to {repository.name}
      </LinkButton>
    );
  }

  // enableIntegration=true, isLoginInProgress=false, isLoggedIn=true
  return (
    <>
      <Icon name="github" size="lg" />
      <a className={styles.ellipsis} href={repository.commitUrl} target="_blank" rel="noreferrer" title="View commit">
        <Icon name="external-link-alt" />
        &nbsp;
        {repository.commitName}
      </a>
    </>
  );
};
