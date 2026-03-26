import { PageLayoutType } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Alert } from '@grafana/ui';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { StyledLink } from './StyledLink';

export function NoDataSourcePage() {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <PageTitle title={t('onboarding.no-data-source.title', 'Grafana Profiles Drilldown')} />

      <Alert severity="error" title={t('onboarding.no-data-source.alert-title', 'Missing Pyroscope data source!')}>
        <Trans i18nKey="onboarding.no-data-source.alert-message">
          This plugin requires a Pyroscope data source. Please{' '}
          <StyledLink href="/connections/datasources/new">add and configure a Pyroscope data source</StyledLink> to your
          Grafana instance.
        </Trans>
      </Alert>
    </PluginPage>
  );
}
