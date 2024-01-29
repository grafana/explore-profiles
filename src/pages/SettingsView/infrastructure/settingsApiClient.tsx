import { config } from '@grafana/runtime';

import { HttpClient } from '../../../shared/infrastructure/HttpClient';

type ApiResponse = {
  settings: Array<{ name: string; value: string }>;
};

export type PluginSettings = {
  collapsedFlamegraphs: boolean;
  maxNodes: number;
  enableFlameGraphDotComExport: boolean;
};

export class SettingsApiClient extends HttpClient {
  static PLUGIN_SETTING_NAME = 'pluginSettings';

  constructor() {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // to ensure that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL('api/plugins/grafana-pyroscope-app/resources/settings.v1.SettingsService', appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
    });
  }

  async get(): Promise<PluginSettings> {
    return super
      .fetch('/Get', { method: 'POST', body: JSON.stringify({}) })
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
      .fetch('/Set', {
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
