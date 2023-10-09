import { AppPluginMeta, GrafanaPlugin, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { merge } from 'lodash';
import { useMemo } from 'react';

import { AppPluginSettings } from '../AppConfig';

export function usePluginSettingsApiClient(plugin: GrafanaPlugin<AppPluginMeta<AppPluginSettings>>) {
  const { meta } = plugin;

  const settingsApiClient = useMemo(
    () => ({
      async update(newMeta: Partial<PluginMeta>) {
        const response = getBackendSrv().fetch({
          url: `/api/plugins/${meta.id}/settings`,
          method: 'POST',
          data: merge({}, meta, newMeta),
        });

        return lastValueFrom(response);
      },
    }),
    [meta]
  );

  return { settingsApiClient };
}
