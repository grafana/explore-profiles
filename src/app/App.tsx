import { AppRootProps, PageLayoutType, PluginContextProvider } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import store from '@pyroscope/redux/store';
import { GitHubContextProvider } from '@shared/components/GitHubContextProvider/GitHubContextProvider';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';

import { Onboarding } from './components/Onboarding/Onboarding';
import { Routes } from './components/Routes/Routes';
import './infrastructure/faro';
import './ui/styles/styles.scss';

export function App(props: AppRootProps) {
  return (
    <PluginContextProvider meta={props.meta}>
      <QueryClientProvider client={queryClient}>
        <GitHubContextProvider>
          <Provider store={store}>
            <Onboarding>
              <PluginPage layout={PageLayoutType.Canvas}>
                <div className="pyroscope-app">
                  <Routes />
                </div>
              </PluginPage>
            </Onboarding>
          </Provider>
        </GitHubContextProvider>
      </QueryClientProvider>
    </PluginContextProvider>
  );
}
