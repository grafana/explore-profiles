import { usePluginComponent } from '@grafana/runtime';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import React, { FC } from 'react';

import { CollectorSelectionMode } from '../../extensions/IntegrationExtension';

export const DeployIntegration: FC<{
  name: string;
  version: string;
  configuration: string;
  collectorSelectionMode?: CollectorSelectionMode;
}> = ({ name, collectorSelectionMode, version, configuration }) => {
  const { component: DeployIntegrationComponent, isLoading } = usePluginComponent<{
    code: Array<{ block: string; platform: string }>;
    name: String;
    version: string;
    collectorSelectionMode?: CollectorSelectionMode;
  }>('grafana-collector-app/deploy-integration/v1');

  const showLoadingBar = false;

  const code = [
    {
      block: configuration,
      platform: 'linux',
    },
  ];

  if (isLoading || showLoadingBar) {
    return <LoadingPlaceholder text="loading..."></LoadingPlaceholder>;
  } else if (DeployIntegrationComponent) {
    return (
      <DeployIntegrationComponent
        code={code}
        name={name}
        collectorSelectionMode={collectorSelectionMode}
        version={version}
      />
    );
  }

  return (
    <Alert title="" severity="warning">
      Deploy integration UI is not available. Please check if you run the latest Grafana on this instance.
    </Alert>
  );
};
