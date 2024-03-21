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
    return this.page.getByTestId('timeline-panel');
  }

  getFlamegraphPanel() {
    return this.page.getByTestId('flamegraph-panel');
  }

  getFlamegraph() {
    return this.page.getByTestId('flameGraph');
  }

  clickOnFlameGraphNode() {
    return this.getFlamegraph().click({
      // go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp.(*Handler).ServeHTTP
      position: {
        x: 180,
        y: 160,
      },
    });
  }

  getExportDataButton() {
    return this.page.getByLabel('Export data');
  }
}
