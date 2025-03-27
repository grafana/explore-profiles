import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { useMutation, useQuery } from '@tanstack/react-query';

import { DEFAULT_SETTINGS, PluginSettings } from './PluginSettings';
import { useSettingsApiClient } from './settingsApiClient';

type FetchParams = {
  enabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  settings?: PluginSettings;
  mutate: (newSettings: PluginSettings) => Promise<void>;
};

/**
 * Fetches the plugin settings and, if none/only some have been stored previously, returns adequate default values for the rest of the application
 */
export function useFetchPluginSettings({ enabled }: FetchParams = {}): FetchResponse {
  const settingsApiClient = useSettingsApiClient();

  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: ['settings', 'ds-uid-' + ApiClient.selectDefaultDataSource().uid],
    queryFn: () =>
      settingsApiClient.get().then(
        (json) =>
          // provide defaults if any value comes null or undefined from the API (which can be the case ;))
          Object.keys(DEFAULT_SETTINGS).reduce((acc, key) => {
            acc[key] ??= DEFAULT_SETTINGS[key as keyof PluginSettings]; // TS luv :man_shrug:
            return acc;
          }, json as Record<string, any>) as PluginSettings // TS luv :man_shrug:
      ),
  });

  const { mutateAsync: mutate } = useMutation({
    mutationFn: (newSettings: PluginSettings) => settingsApiClient.set(newSettings),
    networkMode: 'always',
  });

  return {
    isFetching,
    error: settingsApiClient.isAbortError(error) ? null : error,
    settings: data,
    mutate,
  };
}
