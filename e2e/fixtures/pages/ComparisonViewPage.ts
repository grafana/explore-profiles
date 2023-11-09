import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class ComparisonViewPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/comparison');
  }

  getComparisonContainer() {
    return this.page.getByTestId('comparison-container');
  }
}
