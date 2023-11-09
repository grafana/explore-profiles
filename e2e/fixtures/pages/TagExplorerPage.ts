import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class TagExplorerPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/tag-explorer');
  }

  getMainSpinner() {
    return this.page.getByTestId('table-ui').getByRole('progressbar');
  }
}
