import { useState } from 'react';

import { PluginSettings, settingsApiClient } from './settingsApiClient';

type FetchPluginSettingsResponse = {
  loading: boolean;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (settings || error || loading) {
    return { settings, error, loading, mutate };
  }

  setError(null);
  setLoading(true);

  settingsApiClient
    .get()
    .then(async (json) => {
      settings = json;
      setError(null);
    })
    .catch((error) => {
      setError(error);
    })
    .finally(() => setLoading(false));

  return { settings, error, loading, mutate };
}
