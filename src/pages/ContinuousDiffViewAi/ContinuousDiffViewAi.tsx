import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { PageLayoutType } from '@grafana/data';
import ContinuousDiffView from './components/ContinuousDiffView';

export default function ContinuousDiffViewAi() {
  return (
    <PluginPage layout={PageLayoutType.Standard}>
      <ContinuousDiffView />
    </PluginPage>
  );
}
