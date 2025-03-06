import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert } from '@grafana/ui';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { StyledLink } from './StyledLink';

export function NoDataSourcePage() {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <PageTitle title="Grafana Profiles Drilldown" />

      <Alert severity="error" title="Missing Pyroscope data source!">
        This plugin requires a Pyroscope data source. Please{' '}
        <StyledLink href="/connections/datasources/new">add and configure a Pyroscope data source</StyledLink> to your
        Grafana instance.
      </Alert>
    </PluginPage>
  );
}
