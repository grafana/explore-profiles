import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

export function ErrorPage({ error }: { error: Error }) {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className="pyroscope-app">
        <PageTitle title="Grafana Profiles Drilldown" />

        <InlineBanner
          severity="error"
          title="Fatal error!"
          message="Please try reloading the page or, if the problem persists, contact your organization admin. Sorry for the inconvenience."
          error={error}
          errorContext={{ handheldBy: 'React error boundary' }}
        />
      </div>
    </PluginPage>
  );
}
