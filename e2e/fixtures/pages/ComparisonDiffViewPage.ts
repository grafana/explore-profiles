import { type Page } from '@playwright/test';

import { QueryBuilder } from '../components/QueryBuilder';
import { Timeline } from '../components/Timeline';
import { PyroscopePage } from './PyroscopePage';

export class ComparisonDiffViewPage extends PyroscopePage {
  readonly mainTimeline: Timeline;
  readonly baselineTimeline: Timeline;
  readonly comparisonTimeline: Timeline;

  readonly baselineQueryBuilder: QueryBuilder;
  readonly comparisonQueryBuilder: QueryBuilder;

  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    const urlParams = new URLSearchParams(defaultUrlParams);
    urlParams.set('leftFrom', '1710352800'); // 2024-03-13 19:00:00
    urlParams.set('leftUntil', '1710354300'); // 2024-03-13 19:25:00
    urlParams.set('rightFrom', '1710354300'); // 2024-03-13 19:25:00
    urlParams.set('rightUntil', '1710355800'); // 2024-03-13 19:50:00

    super(page, '/a/grafana-pyroscope-app/comparison-diff', urlParams.toString());

    this.mainTimeline = new Timeline(page, '[data-testid="main-timeline-panel"]');
    this.baselineTimeline = new Timeline(page, '[data-testid="baseline-panel"]');
    this.comparisonTimeline = new Timeline(page, '[data-testid="comparison-panel"]');

    this.baselineQueryBuilder = new QueryBuilder(page, '[data-testid="baseline-panel"] #query-builder-baseline');
    this.comparisonQueryBuilder = new QueryBuilder(page, '[data-testid="comparison-panel"] #query-builder-comparison');
  }

  getMainTimelinePanel() {
    return this.page.getByTestId('main-timeline-panel');
  }

  getBaselinePanel() {
    return this.page.getByTestId('baseline-panel');
  }

  getComparisonPanel() {
    return this.page.getByTestId('comparison-panel');
  }

  getBaselineQueryBuilder() {
    return this.baselineQueryBuilder.get();
  }

  getComparisonQueryBuilder() {
    return this.comparisonQueryBuilder.get();
  }

  getDiffPanel() {
    return this.page.getByTestId('diff-panel');
  }

  getFlamegraph() {
    return this.page.getByTestId('flameGraph');
  }

  getExportDataButton() {
    return this.page.getByLabel('Export data');
  }

  // default position = node "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp.(*Handler).ServeHTTP"
  clickOnFlameGraphNode(position = { x: 180, y: 160 }) {
    return this.getFlamegraph().click({ position });
  }

  getFunctionDetailsMenuItem() {
    return this.getByRole('menuitem', { name: 'Function details' });
  }
}
