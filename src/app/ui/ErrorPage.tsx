import { PageLayoutType } from '@grafana/data';
import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

export function ErrorPage({ error }: { error: Error }) {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className="pyroscope-app">
        <PageTitle title={t('error-page.title', 'Grafana Profiles Drilldown')} />

        <InlineBanner
          severity="error"
          title={t('error-page.banner-title', 'Fatal error!')}
          message={t(
            'error-page.banner-message',
            'Please try reloading the page or, if the problem persists, contact your organization admin. Sorry for the inconvenience.'
          )}
          error={error}
          errorContext={{ handheldBy: 'React error boundary' }}
        />
      </div>
    </PluginPage>
  );
}
