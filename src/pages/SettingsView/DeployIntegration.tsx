import { usePluginComponent } from '@grafana/runtime';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import React, { FC } from 'react';

import { DeployPipelinesExtensionProps } from '../../extensions/DeployPipelinesExtension';

export const DeployIntegration: FC<{
  name: string;
  configuration: string;
}> = ({ name, configuration }) => {
  const { component: DeployIntegrationComponent, isLoading } = usePluginComponent<DeployPipelinesExtensionProps>(
    'grafana-collector-app/deploy-pipelines/v1'
  );

  const showLoadingBar = false;

  const pipelines = [
    {
      block: configuration,
      // must be a valid pipeline name
      name: name.replaceAll(' ', '_').replaceAll('-', '_').replaceAll('.', '_'),
    },
  ];

  if (isLoading || showLoadingBar) {
    return <LoadingPlaceholder text="loading..."></LoadingPlaceholder>;
  } else if (DeployIntegrationComponent) {
    return (
      <DeployIntegrationComponent
        labels={{
          deploy: 'Apply configuration',
          update: 'Update configuration',
          upToDate: 'Configuration is up to date',
          success: 'Configuration successfully saved',
        }}
        pipelines={pipelines}
      />
    );
  }

  return (
    <Alert title="" severity="warning">
      Deploy configuration UI is not available. Please check if you run the latest Grafana on this instance.
    </Alert>
  );
};
