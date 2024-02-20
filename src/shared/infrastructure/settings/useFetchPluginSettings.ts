import { useMutation, useQuery } from '@tanstack/react-query';

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

export function useFetchPluginSettings({ enabled }: FetchParams = {}): FetchResponse {
  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: ['settings'],
    queryFn: () => {
      settingsApiClient.abort();

      return settingsApiClient.get().then((json) => (Object.keys(json).length ? json : DEFAULT_SETTINGS));
    },
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
