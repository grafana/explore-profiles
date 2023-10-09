import { useState } from 'react';
import { getAppEvents } from '@grafana/runtime';
import { AppPluginMeta, AppEvents, GrafanaPlugin } from '@grafana/data';

import { AppPluginSettings } from '../AppConfig';
import { usePluginSettingsApiClient } from './usePluginSettingsApiClient';

export function useAppConfig(plugin: GrafanaPlugin<AppPluginMeta<AppPluginSettings>>) {
  const { settingsApiClient } = usePluginSettingsApiClient(plugin);

  const [enableFlameGraphDotComExport, setEnableFlameGraphDotComExport] = useState<boolean>(
    plugin.meta.jsonData?.enableFlameGraphDotComExport ?? true
  );

  return {
    data: {
      enableFlameGraphDotComExport,
    },
    actions: {
      toggleEnableFlameGraphDotComExport() {
        setEnableFlameGraphDotComExport((v) => !v);
      },
      async saveConfiguration() {
        try {
          await settingsApiClient.update({
            jsonData: {
              enableFlameGraphDotComExport,
            },
          });

          // We reload the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
          // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
          window.location.reload();
        } catch (error) {
          // TODO: is there any offical logger library at Grafana?
          console.error('Error while saving the plugin configuration!');
          console.error(error);

          getAppEvents().publish({
            type: AppEvents.alertError.name,
            payload: [
              'Error while saving the plugin configuration!',
              'Please try again later, sorry for the inconvenience.',
            ],
          });
        }
      },
    },
  };
}
