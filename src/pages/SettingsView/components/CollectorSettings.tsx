import { usePluginComponent } from '@grafana/runtime';
import React, { FC } from 'react';

export const COLLECTOR_SETTINGS_EXTENSION_COMPONENT_ID = 'grafana-collector-app/pyroscope-settings/v1';

interface CollectorSettingsExtensionProps {
  datasource_id: string;
}

export const CollectorSettings: FC<{ datasource_id: string }> = ({ datasource_id }) => {
  const { component: CollectorSettings, isLoading } = usePluginComponent<CollectorSettingsExtensionProps>(
    COLLECTOR_SETTINGS_EXTENSION_COMPONENT_ID
  );

  if (isLoading || CollectorSettings === null || CollectorSettings === undefined) {
    return null;
  }

  return <CollectorSettings datasource_id={datasource_id} />;
};
