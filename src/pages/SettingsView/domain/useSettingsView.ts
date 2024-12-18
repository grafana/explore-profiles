import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { DEFAULT_SETTINGS, PluginSettings } from '@shared/infrastructure/settings/PluginSettings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PLUGIN_BASE_URL, ROUTES } from '../../../constants';

export function useSettingsView() {
  const { settings, error: fetchError, mutate } = useFetchPluginSettings();
  const [maxNodesFromUrl, setMaxNodes] = useMaxNodesFromUrl();
  const [currentSettings, setCurrentSettings] = useState<PluginSettings>(settings ?? DEFAULT_SETTINGS);

  const navigate = useNavigate();
  const location = useLocation();

  const referrerRef = useRef(location.state?.referrer);

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
          displayError(error as Error, [
            'Error while saving the plugin settings!',
            'Please try again later, sorry for the inconvenience.',
          ]);
        }
      },
      goBack() {
        if (!referrerRef.current) {
          navigate(`${PLUGIN_BASE_URL}${ROUTES.PROFILES_EXPLORER_VIEW}`);
          return;
        }

        const backUrl = new URL(referrerRef.current);

        // when calling saveSettings() above, the new maxNodes value is set and the URL search parameter is updated (see useMaxNodesFromUrl.ts)
        if (maxNodesFromUrl) {
          backUrl.searchParams.set('maxNodes', String(maxNodesFromUrl));
        }

        navigate(`${backUrl.pathname}${backUrl.search}`);
      },
    },
  };
}
