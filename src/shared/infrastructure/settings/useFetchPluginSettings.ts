import { useState } from 'react';

import { PluginSettings, settingsApiClient } from './settingsApiClient';

type FetchPluginSettingsResponse = {
  isFetching: boolean;
  error: Error | null;
  settings?: PluginSettings;
  mutate: (newSettings: PluginSettings) => Promise<void>;
};

let settings: PluginSettings; // cache

async function mutate(newSettings: PluginSettings) {
  const response = await settingsApiClient.set(newSettings);

  settings = newSettings;

  return response;
}

export function useFetchPluginSettings(): FetchPluginSettingsResponse {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  if (settings || error || isFetching) {
    return { settings, error, isFetching, mutate };
  }

  setError(null);
  setIsFetching(true);

  settingsApiClient
    .get()
    .then(async (json) => {
      settings = json;
      setError(null);
    })
    .catch((error) => {
      setError(error);
    })
    .finally(() => setIsFetching(false));

  return { settings, error, isFetching, mutate };
}
