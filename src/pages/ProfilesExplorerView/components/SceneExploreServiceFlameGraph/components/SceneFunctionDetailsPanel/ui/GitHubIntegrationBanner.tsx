import { Alert, Icon, TextLink } from '@grafana/ui';
import React from 'react';

type GitHubIntegrationBannerProps = {
  onDismiss: () => void;
};

export const GitHubIntegrationBanner = ({ onDismiss }: GitHubIntegrationBannerProps) => {
  return (
    <Alert severity="info" title="Integrate with Github" buttonContent="Dismiss" onRemove={onDismiss}>
      <p>
        This language supports integration with <Icon name="github" /> GitHub.
      </p>
      <p>
        To activate this feature, you will need to add two new labels when sending profiles{' '}
        <code>service_repository</code> and <code>service_git_ref</code>.{' '}
      </p>
      <p>
        They should respectively be set to the full repository GitHub URL and the current{' '}
        <TextLink href="https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#about-git-references" external>
          git ref
        </TextLink>{' '}
        of the running service.
      </p>
      <Icon name="document-info" />{' '}
      <TextLink
        href="https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/"
        external
      >
        Learn more
      </TextLink>
    </Alert>
  );
};
