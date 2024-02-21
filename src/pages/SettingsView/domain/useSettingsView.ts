import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { DEFAULT_SETTINGS } from '@shared/infrastructure/settings/default-settings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useEffect, useState } from 'react';

export function useSettingsView() {
  const { settings, error: fetchError, mutate } = useFetchPluginSettings();

  if (fetchError) {
    displayError(fetchError, [
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const [collapsedFlamegraphs, setCollapsedFlamegraphs] = useState(settings?.collapsedFlamegraphs);
  const [maxNodes, setMaxNodes] = useState(settings?.maxNodes);
  const [enableFlameGraphDotComExport, setEnableFlameGraphDotComExport] = useState(
    settings?.enableFlameGraphDotComExport
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
            collapsedFlamegraphs: collapsedFlamegraphs ?? DEFAULT_SETTINGS.collapsedFlamegraphs,
            maxNodes: maxNodes ?? DEFAULT_SETTINGS.maxNodes,
            enableFlameGraphDotComExport: enableFlameGraphDotComExport ?? DEFAULT_SETTINGS.enableFlameGraphDotComExport,
          });

          displaySuccess(['Plugin settings successfully saved!']);
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
