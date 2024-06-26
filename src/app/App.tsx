import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Icon } from '@grafana/ui';
import store from '@pyroscope/redux/store';
import { GitHubContextProvider } from '@shared/components/GitHubContextProvider/GitHubContextProvider';
import { displaySuccess } from '@shared/domain/displayStatus';
import { useUrlSearchParams } from '@shared/domain/url-params/useUrlSearchParams';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';

import { Onboarding } from './components/Onboarding/Onboarding';
import { Routes } from './components/Routes/Routes';
import './infrastructure/faro';
import './ui/styles/styles.scss';

async function copyNewUrl() {
  try {
    const newUrl = new URL(window.location.toString());

    newUrl.searchParams.set('to', newUrl.searchParams.get('until') as string);
    newUrl.searchParams.delete('until');

    await navigator.clipboard.writeText(newUrl.toString());

    displaySuccess(['New URL copied to clipboard!']);
  } catch {}
}

function reloadWithNewUrl() {
  const newUrl = new URL(window.location.toString());

  newUrl.searchParams.set('to', newUrl.searchParams.get('until') as string);
  newUrl.searchParams.delete('until');

  window.location.href = newUrl.href;
}

export function App() {
  const { searchParams } = useUrlSearchParams();
  const showUrlDeprecationBanner = searchParams.has('until');

  return (
    <QueryClientProvider client={queryClient}>
      <GitHubContextProvider>
        <Provider store={store}>
          <Onboarding>
            <PluginPage layout={PageLayoutType.Canvas}>
              <div className="pyroscope-app">
                {showUrlDeprecationBanner && (
                  <Alert severity="warning" title="Deprecated URL!">
                    <p>
                      The URL that you&apos;ve used to access this page is deprecated. Specifically, the &quot;
                      <strong>until</strong>&quot; search parameter used for the time range has been removed in favour
                      of &quot;<strong>to</strong>&quot;, which is the standard Grafana parameter.
                    </p>
                    <p>As a consequence, this page will not work as expected.</p>
                    <p>
                      If the URL comes from a bookmark, click on the &quot;Copy new URL&quot; button and update it. If
                      not, click on &quot;Reload page with new URL&quot;
                    </p>
                    <p>
                      <Button aria-label="Copy new URL" onClick={copyNewUrl}>
                        <Icon name="copy" />
                        &nbsp;Copy new URL
                      </Button>
                      &nbsp; &nbsp;
                      <Button aria-label="Reload page with new URL" onClick={reloadWithNewUrl}>
                        <Icon name="sync" />
                        &nbsp;Reload page with new URL
                      </Button>
                    </p>
                  </Alert>
                )}
                <Routes />
              </div>
            </PluginPage>
          </Onboarding>
        </Provider>
      </GitHubContextProvider>
    </QueryClientProvider>
  );
}
