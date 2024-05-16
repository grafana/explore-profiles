import { IconName } from '@grafana/data';
import { Props as FlameGraphProps } from '@grafana/flamegraph';
import { useGitHubContext } from '@shared/components/GitHubContextProvider/useGitHubContext';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useCallback, useState } from 'react';

import { buildStacktrace } from './buildStacktrace';

export function useGitHubIntegration(sidePanel: any): DomainHookReturnValue {
  const { login, isSessionExpired } = useGitHubContext();
  const { settings } = useFetchPluginSettings();

  const isFunctionDetailsEnabled = settings?.enableFunctionDetails;

  const [stacktrace, setStacktrace] = useState<string[]>([]);

  const getExtraFlameGraphMenuItems: FlameGraphProps['getExtraContextMenuButtons'] = useCallback(
    ({ item }: any, data: any) => {
      // clicking on the top-level "total" node doesn't add "Function details" as an extra contextual menu item
      if (!isFunctionDetailsEnabled || item.level === 0) {
        return [];
      }

      return [
        {
          label: 'Function details',
          icon: 'info-circle' as IconName,
          onClick: () => {
            reportInteraction('g_pyroscope_app_function_details_clicked');

            setStacktrace(buildStacktrace(item, data));

            sidePanel.open('function-details');

            // login can only happen as a consequence of a user action
            // this is why we check if the session is expired here and not whenever we make a request to the API
            if (isSessionExpired) {
              login();
            }
          },
        },
      ];
    },
    [isFunctionDetailsEnabled, isSessionExpired, login, sidePanel]
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
