import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import React from 'react';

import { AdHocTabs } from './ui/AdHocTabs';

export default function AdHocView() {
  return (
    <PluginPage layout={PageLayoutType.Custom} renderTitle={() => null}>
      <AdHocTabs />
    </PluginPage>
  );
}
