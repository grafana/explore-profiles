import { type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class TagExplorerPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/tag-explorer', defaultUrlParams);
  }

  getMainSpinner() {
    return this.page.getByRole('progressbar');
  }
}
