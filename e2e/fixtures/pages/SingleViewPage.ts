import { type Page } from '@playwright/test';

import { QueryBuilder } from '../components/QueryBuilder';
import { PyroscopePage } from './PyroscopePage';

export class SingleViewPage extends PyroscopePage {
  readonly queryBuilder: QueryBuilder;

  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    super(page, '/a/grafana-pyroscope-app/single', defaultUrlParams.toString());

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

  // default position = node "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp.(*Handler).ServeHTTP"
  clickOnFlameGraphNode(position = { x: 180, y: 160 }) {
    return this.getFlamegraph().click({ position });
  }

  getFunctionDetailsMenuItem() {
    return this.getByRole('menuitem', { name: 'Function details' });
  }

  clickOnFunctionDetailsMenuItem() {
    return this.getFunctionDetailsMenuItem().click();
  }

  getExportDataButton() {
    return this.page.getByLabel('Export data');
  }
}
