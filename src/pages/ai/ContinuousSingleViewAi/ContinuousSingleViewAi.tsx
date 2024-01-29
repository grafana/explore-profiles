import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React from 'react';

import ContinuousSingleView from './components/ContinuousSingleView';

export default function ContinuousSingleViewAi() {
  return (
    <PluginPage layout={PageLayoutType.Standard}>
      <ContinuousSingleView />
    </PluginPage>
  );
}
