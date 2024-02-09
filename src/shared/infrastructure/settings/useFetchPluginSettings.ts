import { useQuery } from '@tanstack/react-query';

import { DEFAULT_SETTINGS } from './default-settings';
import { PluginSettings, settingsApiClient } from './settingsApiClient';

type FetchParams = {
  enabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  settings?: PluginSettings;
  mutate: (newSettings: PluginSettings) => Promise<void>;
};

// TODO: use react-query? (https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
async function mutate(newSettings: PluginSettings) {
  await settingsApiClient.set(newSettings);
}

export function useFetchPluginSettings({ enabled }: FetchParams = {}): FetchResponse {
  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: [],
    queryFn: () => {
      settingsApiClient.abort();

      return settingsApiClient.get().then((json) => (Object.keys(json).length ? json : DEFAULT_SETTINGS));
    },
  });

  return {
    isFetching,
    error: settingsApiClient.isAbortError(error) ? null : error,
    settings: data,
    mutate,
  };
}
