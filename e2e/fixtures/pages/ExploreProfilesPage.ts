import { type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class ExploreProfilesPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    const urlParams = new URLSearchParams(defaultUrlParams);

    super(page, '/a/grafana-pyroscope-app/profiles-explorer', urlParams.toString());
  }

  getExplorationTypeSelector() {
    return this.page.getByTestId('exploration-types');
  }

  async getSelectedExplorationType() {
    const label = await this.getExplorationTypeSelector().locator('button[data-testid="is-active"]').textContent();
    return label?.trim();
  }
}
