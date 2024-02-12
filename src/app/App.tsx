import * as React from 'react';
import { AppRootProps, PageLayoutType, PluginContextProvider } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import store from '@pyroscope/redux/store';
import { setupReduxQuerySync } from '@pyroscope/redux/useReduxQuerySync';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';

import './infrastructure/faro';
import { Onboarding } from './ui/Onboarding/Onboarding';
import { Routes } from './ui/Routes';
import './ui/styles.scss';
import { TitleReplacement } from './ui/TitleReplacement';

// Module augmentation so that typescript sees our 'custom' element
/* eslint-disable no-unused-vars */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'pyroscope-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// TODO: TEMP until finishing the Pyroscope OSS migration
function shouldSetupReduxQuerySync() {
  return [
    '/a/grafana-pyroscope-app/settings',
    '/a/grafana-pyroscope-app/ad-hoc',
    // TODO Pyroscope OSS migration: add new paths below
    '/a/grafana-pyroscope-app/single',
  ].includes(window.location.pathname);
}

export function App(props: AppRootProps) {
  const unsubscribeRef = useRef<unknown>(null);

  // disable Redux in migrated pages
  if (!shouldSetupReduxQuerySync() && !unsubscribeRef.current) {
    // we have to register as soon as possible to prevent loading apps before having parsed the URL parameters
    // we do this here and not at the top-level module scope so we can enable the plugin to be preloaded without setting history listeners,
    // which could cause conflicts with other parts of the platform or plugins
    unsubscribeRef.current = setupReduxQuerySync();
  }

  useEffect(
    () => () => {
      if (typeof unsubscribeRef.current === 'function') {
        // leave no trace when navigating outside of the plugin pages (see https://github.com/grafana/pyroscope-app-plugin/issues/171)
        unsubscribeRef.current();
      }
    },
    []
  );

  const renderTitle = React.useCallback((title: string) => <TitleReplacement title={title} />, []);

  return (
    <PluginContextProvider meta={props.meta}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <Onboarding>
            <PluginPage layout={PageLayoutType.Standard} renderTitle={renderTitle}>
              <pyroscope-app className="app">
                <div className="pyroscope-app">
                  <Routes />
                </div>
              </pyroscope-app>
            </PluginPage>
          </Onboarding>
        </Provider>
      </QueryClientProvider>
    </PluginContextProvider>
  );
}
