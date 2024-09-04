import { PageLayoutType, usePluginContext } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { setTrackingVersion } from '@shared/domain/reportInteraction';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import { Onboarding } from './components/Onboarding/Onboarding';
import { Routes } from './components/Routes/Routes';
import './infrastructure/faro';

export function App() {
  const {
    meta: {
      info: { version },
    },
  } = usePluginContext();

  useEffect(() => {
    setTrackingVersion(version);
  }, [version]);

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
