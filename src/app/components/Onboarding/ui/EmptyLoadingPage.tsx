import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Icon } from '@grafana/ui';
import React from 'react';

import { TitleReplacement } from '../../../ui/TitleReplacement';

const renderLoadingTitle = () => (
  <TitleReplacement
    title={
      (
        <span>
          Loading... <Icon name="fa fa-spinner" />
        </span>
      ) as unknown as string
    }
  />
);

export function EmptyLoadingPage() {
  return (
    <PluginPage renderTitle={renderLoadingTitle} layout={PageLayoutType.Standard}>
      <></>
    </PluginPage>
  );
}
