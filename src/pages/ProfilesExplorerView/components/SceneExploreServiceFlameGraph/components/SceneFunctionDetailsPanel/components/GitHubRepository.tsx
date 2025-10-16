import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, IconButton, Spinner, useStyles2 } from '@grafana/ui';
import React from 'react';

import { useGitHubContext } from './GitHubContextProvider/useGitHubContext';

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
  const { isLoginInProgress, isLoggedIn, login, logout } = useGitHubContext();

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
      <Button
        icon="github"
        variant="primary"
        onClick={login}
        tooltip="Once connected, the GitHub code will be accessible only from this browser session."
        tooltipPlacement="top"
      >
        Connect to {repository.name}
      </Button>
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
      <IconButton
        name="signout"
        onClick={() => logout()}
        aria-label="Disconnect from GitHub"
        title="Disconnect from GitHub"
      />
    </>
  );
};
