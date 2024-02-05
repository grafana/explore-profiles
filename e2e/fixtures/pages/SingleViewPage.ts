import { type Page } from '@playwright/test';

import { QueryBuilder } from '../components/QueryBuilder';
import { PyroscopePage } from './PyroscopePage';

export class SingleViewPage extends PyroscopePage {
  readonly queryBuilder: QueryBuilder;

  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/single', defaultUrlParams);

    this.queryBuilder = new QueryBuilder(page, '#query-builder-single');
  }

  getTimelinePanel() {
    // TODO: improve with data-testid when migrating Pyroscope OSS
    return this.page.locator('[class$="-panel-container"]').nth(0);
  }

  getFlamegraphPanel() {
    // TODO: improve with data-testid when migrating Pyroscope OSS
    return this.page.locator('[class$="-panel-container"]').nth(1);
  }

  getFlamegraph() {
    return this.page.getByTestId('flameGraph');
  }

  getExportDataButton() {
    return this.page.getByLabel('Export data');
  }
}
