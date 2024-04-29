import { DataFrame, usePluginContext } from '@grafana/data';
import { ClickedItemData, ExtraContextMenuButton } from '@shared/components/@grafana-experimental-flamegraph/src/types';
import { useGitHubContext } from '@shared/components/GitHubContextProvider/useGitHubContext';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useCallback, useState } from 'react';

import { buildStacktrace } from './buildStacktrace';

export function useGitHubIntegration(sidePanel: any): DomainHookReturnValue {
  const { login, isSessionExpired } = useGitHubContext();

  const pluginContext = usePluginContext();

  const isGitHubIntegrationEnabled = Boolean(
    (pluginContext.meta.jsonData as AppPluginSettings).isGitHubIntegrationEnabled
  );

  const [stacktrace, setStacktrace] = useState<string[]>([]);

  const getExtraFlameGraphMenuItems = useCallback(
    ({ item }: ClickedItemData, data: DataFrame) => {
      // clicking on the top-level "total" node doesn't add "Function details" as an extra contextual menu item
      if (!isGitHubIntegrationEnabled || item.level === 0) {
        return [];
      }

      return [
        {
          label: 'Function details',
          icon: 'info-circle',
          onClick: async () => {
            reportInteraction('g_pyroscope_app_function_details_clicked');

            setStacktrace(buildStacktrace(item, data));

            sidePanel.open('function-details');

            // login can only happen as a consequence of a user action
            // this is why we check if the session is expired here and not whenever we make a request to the API
            if (isSessionExpired) {
              await login();
            }
          },
        },
      ] as ExtraContextMenuButton[];
    },
    [isGitHubIntegrationEnabled, isSessionExpired, login, sidePanel]
  );

  return {
    data: {
      stacktrace,
    },
    actions: {
      getExtraFlameGraphMenuItems,
    },
  };
}
