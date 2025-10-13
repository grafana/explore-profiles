import { type Page } from '@playwright/test';

import { DEFAULT_SETTINGS } from '../../../src/shared/infrastructure/settings/PluginSettings';
import { DEFAULT_EXPLORE_PROFILES_DATASOURCE_UID } from '../../config/constants';
import { PyroscopePage } from './PyroscopePage';

export class SettingsPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/settings', '');
  }

  async goto() {
    await this.page.goto(this.pathname);
  }

  async resetTestSettings(reloadPage = true) {
    // see src/shared/infrastructure/http/ApiClient.ts
    let { appUrl, dataSourceUid } = await this.page.evaluate(() => ({
      appUrl: (window as any).grafanaBootData.settings.appUrl,
      dataSourceUid: new URL(window.location.href).searchParams.get('var-dataSource'),
    }));

    if (appUrl.at(-1) !== '/') {
      appUrl += '/';
    }

    const apiUrl = new URL(
      `api/datasources/proxy/uid/${
        dataSourceUid || DEFAULT_EXPLORE_PROFILES_DATASOURCE_UID
      }/settings.v1.SettingsService/Set`,
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

    if (reloadPage) {
      await this.page.reload();
    }
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

  getMetricsFromProfilesCheckbox() {
    return this.page.getByTestId('metrics-from-profiles').getByLabel('Enable metrics from profiles');
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
