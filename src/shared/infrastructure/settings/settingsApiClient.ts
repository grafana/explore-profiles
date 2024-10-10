import { ApiClient } from '../http/ApiClient';
import { PluginSettings } from './PluginSettings';

type ApiResponse = {
  settings: Array<{ name: string; value: string }>;
};

class SettingsApiClient extends ApiClient {
  static PLUGIN_SETTING_NAME = 'pluginSettings';

  async get(): Promise<PluginSettings> {
    return super
      .fetch('/settings.v1.SettingsService/Get', { method: 'POST', body: JSON.stringify({}) })
      .then((response) => response.json())
      .then((json: ApiResponse) => {
        if (!json.settings) {
          return {};
        }

        const setting = json.settings.find(({ name }) => name === SettingsApiClient.PLUGIN_SETTING_NAME);

        if (!setting) {
          throw new Error('Setting not found!');
        }

        return JSON.parse(setting.value);
      });
  }

  async set(newSettings: PluginSettings) {
    return super
      .fetch('/settings.v1.SettingsService/Set', {
        method: 'POST',
        body: JSON.stringify({
          setting: {
            name: SettingsApiClient.PLUGIN_SETTING_NAME,
            value: JSON.stringify(newSettings),
          },
        }),
      })
      .then((response) => response.json());
  }
}

export const settingsApiClient = new SettingsApiClient();
