import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class ComparisonDiffViewPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/comparison-diff', defaultUrlParams);
  }

  getComparisonContainer() {
    // TODO: fix and use data test ids "data-testid Panel header [object Object]" in Pyroscope OSS
    return this.page.locator('.diff-instructions-wrapper');
  }

  getDiffContainer() {
    // TODO: fix and use data test ids "data-testid Panel header [object Object]" in Pyroscope OSS
    return this.page.locator('.pyroscope-app');
  }
}
