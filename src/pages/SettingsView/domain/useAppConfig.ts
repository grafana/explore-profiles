import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { displayError } from '@shared/domain/displayStatus';
import { DEFAULT_SETTINGS } from '@shared/infrastructure/settings/default-settings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useEffect, useState } from 'react';

export function useAppConfig() {
  const { settings, error: fetchSettingsError, mutate } = useFetchPluginSettings();

  if (fetchSettingsError) {
    displayError(fetchSettingsError, [
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const [collapsedFlamegraphs, setCollapsedFlamegraphs] = useState<boolean>(
    settings?.collapsedFlamegraphs ?? DEFAULT_SETTINGS.collapsedFlamegraphs
  );
  const [maxNodes, setMaxNodes] = useState<number>(settings?.maxNodes ?? DEFAULT_SETTINGS.maxNodes);

  const [enableFlameGraphDotComExport, setEnableFlameGraphDotComExport] = useState<boolean>(
    settings?.enableFlameGraphDotComExport ?? DEFAULT_SETTINGS.enableFlameGraphDotComExport
  );

  useEffect(() => {
    if (settings) {
      setCollapsedFlamegraphs(settings.collapsedFlamegraphs);
      setMaxNodes(settings.maxNodes);
      setEnableFlameGraphDotComExport(settings.enableFlameGraphDotComExport);
    }
  }, [settings]);

  return {
    data: {
      collapsedFlamegraphs,
      maxNodes,
      enableFlameGraphDotComExport,
    },
    actions: {
      toggleCollapsedFlamegraphs() {
        setCollapsedFlamegraphs((v) => !v);
      },
      updateMaxNodes(event: React.ChangeEvent<HTMLInputElement>) {
        setMaxNodes(Number(event.target.value));
      },
      toggleEnableFlameGraphDotComExport() {
        setEnableFlameGraphDotComExport((v) => !v);
      },
      async saveSettings() {
        try {
          await mutate({
            collapsedFlamegraphs,
            maxNodes,
            enableFlameGraphDotComExport,
          });

          getAppEvents().publish({
            type: AppEvents.alertSuccess.name,
            payload: ['Plugin settings successfully saved!'],
          });
        } catch (error) {
          displayError(error, [
            'Error while saving the plugin settings!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
    },
  };
}
