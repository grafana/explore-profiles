import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React from 'react';

import ContinuousDiffView from './components/ContinuousDiffView';

export default function ContinuousDiffViewAi() {
  return (
    <PluginPage layout={PageLayoutType.Standard}>
      <ContinuousDiffView />
    </PluginPage>
  );
}
