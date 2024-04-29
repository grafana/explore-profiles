import { type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class ComparisonDiffViewPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    super(page, '/a/grafana-pyroscope-app/comparison-diff', defaultUrlParams.toString());
  }

  getBaselinePanel() {
    return this.page.getByTestId('baseline-panel');
  }

  getBaselineQueryBuilder() {
    return this.getBaselinePanel().locator('#query-builder-single');
  }

  getComparisonPanel() {
    return this.page.getByTestId('comparison-panel');
  }

  getComparisonQueryBuilder() {
    return this.getComparisonPanel().locator('#query-builder-single');
  }

  getDiffPanel() {
    return this.page.getByTestId('diff-panel');
  }
}
