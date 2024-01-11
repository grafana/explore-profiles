import { useEffect, useState } from 'react';
import { getAppEvents } from '@grafana/runtime';
import { AppEvents } from '@grafana/data';

import { useFetchPluginSettings } from './useFetchPluginSettings';

export const DEFAULT_SETTINGS = {
  COLLAPSED_FLAMEGRAPHS: false,
  MAX_NODES: 16384,
  ENABLE_FLAMEGRAPHDOTCOM_EXPORT: true,
};

function reportError(error: Error, msgs: string[]) {
  console.error(msgs[0]);
  console.error(error);

  getAppEvents().publish({
    type: AppEvents.alertError.name,
    payload: msgs,
  });
}

export function useAppConfig() {
  const { settings, error: fecthConfigError, mutate } = useFetchPluginSettings();

  if (fecthConfigError) {
    reportError(fecthConfigError, [
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
          reportError(error as Error, [
            'Error while saving the plugin settings!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
    },
  };
}
