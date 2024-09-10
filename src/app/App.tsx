import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { Onboarding } from './components/Onboarding/Onboarding';
import { Routes } from './components/Routes/Routes';
import './infrastructure/faro';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Onboarding>
        <PluginPage layout={PageLayoutType.Canvas}>
          <div className="pyroscope-app">
            <Routes />
          </div>
        </PluginPage>
      </Onboarding>
    </QueryClientProvider>
  );
}
