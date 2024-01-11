import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class SettingsPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/plugins/grafana-pyroscope-app', '');
  }

  async goto() {
    await this.page.goto(this.pathname);
  }

  async resetTestSettings() {
    // see src/components/AppConfig/hooks/settingsApiClient.tsx
    let appUrl = await this.page.evaluate(() => (window as any).grafanaBootData.settings.appUrl);

    if (appUrl.at(-1) !== '/') {
      appUrl += '/';
    }

    const apiUrl = new URL('api/plugins/grafana-pyroscope-app/resources/settings.v1.SettingsService/Set', appUrl);

    await this.page.request.post(apiUrl.toString(), {
      data: {
        setting: {
          name: 'pluginSettings',
          value: JSON.stringify({
            collapsedFlamegraphs: false,
            maxNodes: 16384,
            enableFlameGraphDotComExport: true,
          }),
        },
      },
    });

    await this.page.reload();
  }

  getFlamegraphSettings() {
    return this.page.getByTestId('flamegraph-settings');
  }

  getCollapsedFlamegraphsCheckbox() {
    return this.getFlamegraphSettings().getByLabel('Toggle collapsed flamegraphs');
  }

  getMaxNodesInput() {
    return this.getFlamegraphSettings().getByRole('spinbutton');
  }

  getExportSettings() {
    return this.page.getByTestId('export-settings');
  }

  getEnableFlamegraphDotComCheckbox() {
    return this.getExportSettings().getByLabel('Toggle export to flamegraph.com');
  }

  getSaveSettingsButton() {
    return this.page.getByRole('button', { name: /save settings/i });
  }

  getSuccessAlertDialog() {
    return this.page.getByRole('status', { name: /plugin settings successfully saved!/i });
  }
}
