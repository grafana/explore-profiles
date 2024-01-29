import { type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class ComparisonViewPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/comparison', defaultUrlParams);
  }

  getBaselinePanel() {
    return this.page.getByTestId('baseline-panel');
  }

  getComparisonPanel() {
    return this.page.getByTestId('comparison-panel');
  }

  getBaselineQueryBuilder() {
    return this.getBaselinePanel().locator('#query-builder-single');
  }

  getComparisonQueryBuilder() {
    return this.getComparisonPanel().locator('#query-builder-single');
  }
}
