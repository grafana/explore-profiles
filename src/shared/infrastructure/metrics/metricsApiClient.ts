import { ApiClient } from '@shared/infrastructure/http/ApiClient';

import { Metric } from './Metric';

type ApiResponse = {
  settings: Array<{ name: string; value: string }>;
};

// todo(bryan): Refactor this to use the existing SettingsApiClient.
class MetricsApiClient extends ApiClient {
  static METRIC_SETTING_PREFIX = 'metric.';

  async get(): Promise<Metric[]> {
    return super
      .fetch('/settings.v1.SettingsService/Get', { method: 'POST', body: JSON.stringify({}) })
      .then((response) => response.json())
      .then((json: ApiResponse) => {
        if (!json.settings) {
          return [];
        }

        return json.settings
          .filter(({ name }) => name.startsWith(MetricsApiClient.METRIC_SETTING_PREFIX))
          .map((setting) => JSON.parse(setting.value));
      });
  }

  async create(metric: Metric): Promise<void> {
    return super
      .fetch('/settings.v1.SettingsService/Set', {
        method: 'POST',
        body: JSON.stringify({
          setting: {
            name: this.withPrefix(metric.name),
            value: JSON.stringify(metric),
          },
        }),
      })
      .then((response) => response.json());
  }

  private withPrefix(name: string): string {
    return `${MetricsApiClient.METRIC_SETTING_PREFIX}${name}`;
  }
}

export const metricsApiClient = new MetricsApiClient();
