import { PageLayoutType } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Icon } from '@grafana/ui';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

export function EmptyLoadingPage() {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <PageTitle
        title={
          <span>
            <Trans i18nKey="onboarding.empty-loading.title">Loading...</Trans> <Icon name="fa fa-spinner" />
          </span>
        }
      />
    </PluginPage>
  );
}
