import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { DEFAULT_SETTINGS, PluginSettings } from '@shared/infrastructure/settings/PluginSettings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useEffect, useState } from 'react';

export function useSettingsView() {
  const { settings, error: fetchError, mutate } = useFetchPluginSettings();
  const [, setMaxNodes] = useMaxNodesFromUrl();

  const [currentSettings, setCurrentSettings] = useState<PluginSettings>(settings ?? DEFAULT_SETTINGS);

  useEffect(() => {
    if (settings) {
      setCurrentSettings(settings);
    }
  }, [settings]);

  return {
    data: {
      ...currentSettings,
      fetchError,
    },
    actions: {
      toggleCollapsedFlamegraphs() {
        setCurrentSettings((s) => ({
          ...s,
          collapsedFlamegraphs: !s.collapsedFlamegraphs,
        }));
      },
      updateMaxNodes(event: React.ChangeEvent<HTMLInputElement>) {
        setCurrentSettings((s) => ({
          ...s,
          maxNodes: Number(event.target.value),
        }));
      },
      toggleEnableFlameGraphDotComExport() {
        setCurrentSettings((s) => ({
          ...s,
          enableFlameGraphDotComExport: !s.enableFlameGraphDotComExport,
        }));
      },
      toggleEnableFunctionDetails() {
        setCurrentSettings((s) => ({
          ...s,
          enableFunctionDetails: !s.enableFunctionDetails,
        }));
      },
      async saveSettings() {
        setMaxNodes(currentSettings.maxNodes);

        try {
          await mutate(currentSettings);

          displaySuccess(['Plugin settings successfully saved!']);
        } catch (error) {
          displayError(error, [
            'Error while saving the plugin settings!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
      goBack() {
        history.back();
      },
    },
  };
}
