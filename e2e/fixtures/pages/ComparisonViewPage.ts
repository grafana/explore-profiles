import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class ComparisonViewPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/comparison', defaultUrlParams);
  }

  getComparisonContainer() {
    return this.page.getByTestId('comparison-container');
  }
}
