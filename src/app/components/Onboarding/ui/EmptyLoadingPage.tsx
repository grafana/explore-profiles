import { PageLayoutType } from '@grafana/data';
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
            Loading... <Icon name="fa fa-spinner" />
          </span>
        }
      />
    </PluginPage>
  );
}
