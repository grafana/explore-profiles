import { AppRootProps, PageLayoutType, PluginContextProvider } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import store from '@pyroscope/redux/store';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';

import { Onboarding } from './components/Onboarding/Onboarding';
import { Routes } from './components/Routes/Routes';
import { useSetupReduxQuerySync } from './domain/useSetupReduxQuerySync';
import './infrastructure/faro';
import './ui/styles/styles.scss';
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

const renderPageTitle = (title: string) => <TitleReplacement title={title} />;

export function App(props: AppRootProps) {
  useSetupReduxQuerySync();

  return (
    <PluginContextProvider meta={props.meta}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <Onboarding>
            <PluginPage layout={PageLayoutType.Standard} renderTitle={renderPageTitle}>
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
