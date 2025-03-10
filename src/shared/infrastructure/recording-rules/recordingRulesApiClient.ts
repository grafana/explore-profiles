import { ApiClient } from '@shared/infrastructure/http/ApiClient';

import { RecordingRule } from './RecordingRule';

type ApiResponse = {
  settings: Array<{ name: string; value: string }>;
};

// TODO(bryan): refactor this to use generated protobuf types
class RecordingRulesApiClient extends ApiClient {
  static RECORDING_RULE_SETTING_PREFIX = 'metric.';

  async get(): Promise<RecordingRule[]> {
    return super
      .fetch('/settings.v1.SettingsService/Get', { method: 'POST', body: JSON.stringify({}) })
      .then((response) => response.json())
      .then((json: ApiResponse) => {
        if (!json.settings) {
          return [];
        }

        return json.settings
          .filter(({ name }) => name.startsWith(RecordingRulesApiClient.RECORDING_RULE_SETTING_PREFIX))
          .map((setting) => JSON.parse(setting.value));
      });
  }

  async create(rule: RecordingRule): Promise<void> {
    return super
      .fetch('/settings.v1.SettingsService/Set', {
        method: 'POST',
        body: JSON.stringify({
          setting: {
            name: this.withPrefix(rule.name),
            value: JSON.stringify(rule),
          },
        }),
      })
      .then((response) => response.json());
  }

  async remove(rule: RecordingRule): Promise<void> {
    return super
      .fetch('/settings.v1.SettingsService/Delete', {
        method: 'POST',
        body: JSON.stringify({
          name: this.withPrefix(rule.name),
        }),
      })
      .then((response) => response.json());
  }

  private withPrefix(name: string): string {
    return `${RecordingRulesApiClient.RECORDING_RULE_SETTING_PREFIX}${name}`;
  }
}

export const recordingRulesApiClient = new RecordingRulesApiClient();
