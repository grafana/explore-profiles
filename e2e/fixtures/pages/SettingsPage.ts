import { type Page } from '@playwright/test';

import { DEFAULT_SETTINGS } from '../../../src/shared/infrastructure/settings/PluginSettings';
import { PyroscopePage } from './PyroscopePage';

export class SettingsPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/settings', '');
  }

  async goto() {
    await this.page.goto(this.pathname);
  }

  async resetTestSettings() {
    // see src/shared/infrastructure/http/ApiClient.ts
    let appUrl = await this.page.evaluate(() => (window as any).grafanaBootData.settings.appUrl);
    if (appUrl.at(-1) !== '/') {
      appUrl += '/';
    }

    // IMPORTANT: the path must match the default data source in samples/provisioning/datasources/datasources.yaml
    const apiUrl = new URL(
      'api/datasources/proxy/uid/grafanacloud-profiles-local-bis/settings.v1.SettingsService/Set',
      appUrl
    );

    await this.page.request.post(apiUrl.toString(), {
      data: {
        setting: {
          name: 'pluginSettings',
          value: JSON.stringify(DEFAULT_SETTINGS),
        },
      },
    });

    await this.page.reload();
  }

  getFlamegraphSettings() {
    return this.page.getByTestId('flamegraph-settings');
  }

  getCollapsedFlamegraphsCheckbox() {
    return this.getFlamegraphSettings().getByLabel('Toggle collapsed flame graphs');
  }

  getMaxNodesInput() {
    return this.getFlamegraphSettings().getByRole('spinbutton');
  }

  getExportSettings() {
    return this.page.getByTestId('export-settings');
  }

  getFunctionDetailsSettings() {
    return this.page.getByTestId('function-details-settings');
  }

  getEnableFlamegraphDotComCheckbox() {
    return this.getExportSettings().getByLabel('Toggle export to flamegraph.com');
  }

  getEnableFunctionDetailsCheckbox() {
    return this.getFunctionDetailsSettings().getByLabel('Toggle function details');
  }

  getSaveSettingsButton() {
    return this.page.getByRole('button', { name: /save settings/i });
  }

  getSuccessAlertDialog() {
    return this.page.getByRole('status', { name: /plugin settings successfully saved!/i });
  }
}
