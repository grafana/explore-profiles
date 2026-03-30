import { t, Trans } from '@grafana/i18n';
import { Alert, Icon, TextLink } from '@grafana/ui';
import React from 'react';

type GitHubIntegrationBannerProps = {
  onDismiss: () => void;
};

export const GitHubIntegrationBanner = ({ onDismiss }: GitHubIntegrationBannerProps) => {
  return (
    <Alert
      severity="info"
      title={t('function-details.github.banner-title', 'Integrate with Github')}
      buttonContent={t('function-details.github.banner-dismiss', 'Dismiss')}
      onRemove={onDismiss}
    >
      <p>
        <Trans i18nKey="function-details.github.banner-language-support">
          This language supports integration with <Icon name="github" /> GitHub.
        </Trans>
      </p>
      <p>
        <Trans i18nKey="function-details.github.banner-labels">
          To activate this feature, you will need to add two new labels when sending profiles{' '}
          <code>service_repository</code> and <code>service_git_ref</code>.{' '}
        </Trans>
      </p>
      <p>
        <Trans i18nKey="function-details.github.banner-git-ref">
          They should respectively be set to the full repository GitHub URL and the current{' '}
          <TextLink href="https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#about-git-references" external>
            git ref
          </TextLink>{' '}
          of the running service.
        </Trans>
      </p>
      <Icon name="document-info" />{' '}
      <TextLink
        href="https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/"
        external
      >
        <Trans i18nKey="function-details.github.banner-learn-more">Learn more</Trans>
      </TextLink>
    </Alert>
  );
};
