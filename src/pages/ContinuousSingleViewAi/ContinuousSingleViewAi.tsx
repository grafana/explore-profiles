import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { PageLayoutType } from '@grafana/data';
import ContinuousSingleView from './components/ContinuousSingleView';

export default function ContinuousSingleViewAi() {
  return (
    <PluginPage layout={PageLayoutType.Standard}>
      <ContinuousSingleView />
    </PluginPage>
  );
}
