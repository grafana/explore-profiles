import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { useEffect, useState } from 'react';

import { displayError } from '../../../shared/domain/displayError';
import { useFetchPluginSettings } from '../../../shared/infrastructure/settings/useFetchPluginSettings';

export const DEFAULT_SETTINGS = {
  COLLAPSED_FLAMEGRAPHS: false,
  MAX_NODES: 16384,
  ENABLE_FLAMEGRAPHDOTCOM_EXPORT: true,
};

export function useAppConfig() {
  const { settings, error: fetchConfigError, mutate } = useFetchPluginSettings();

  if (fetchConfigError) {
    displayError(fetchConfigError, [
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const [collapsedFlamegraphs, setCollapsedFlamegraphs] = useState<boolean>(
    settings?.collapsedFlamegraphs ?? DEFAULT_SETTINGS.COLLAPSED_FLAMEGRAPHS
  );
  const [maxNodes, setMaxNodes] = useState<number>(settings?.maxNodes ?? DEFAULT_SETTINGS.MAX_NODES);

  const [enableFlameGraphDotComExport, setEnableFlameGraphDotComExport] = useState<boolean>(
    settings?.enableFlameGraphDotComExport ?? DEFAULT_SETTINGS.ENABLE_FLAMEGRAPHDOTCOM_EXPORT
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
