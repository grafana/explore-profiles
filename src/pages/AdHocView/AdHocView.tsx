import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { PageLayoutType } from '@grafana/data';

import { AdHocTabs } from './ui/AdHocTabs';

export default function AdHocView() {
  return (
    <PluginPage layout={PageLayoutType.Custom} renderTitle={() => null}>
      <AdHocTabs />
    </PluginPage>
  );
}
