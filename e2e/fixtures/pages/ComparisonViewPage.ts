import { type Page } from '@playwright/test';

import { QueryBuilder } from '../components/QueryBuilder';
import { Timeline } from '../components/Timeline';
import { PyroscopePage } from './PyroscopePage';

export class ComparisonViewPage extends PyroscopePage {
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

    super(page, '/a/grafana-pyroscope-app/comparison', urlParams.toString());

    // TODO: use "main-timeline-panel"
    this.mainTimeline = new Timeline(page, '[data-testid="panel"]');
    this.baselineTimeline = new Timeline(page, '[data-testid="baseline-panel"]');
    this.comparisonTimeline = new Timeline(page, '[data-testid="comparison-panel"]');

    this.baselineQueryBuilder = new QueryBuilder(page, '[data-testid="baseline-panel"] #query-builder-single');
    this.comparisonQueryBuilder = new QueryBuilder(page, '[data-testid="comparison-panel"] #query-builder-single');
  }

  getMainTimelinePanel() {
    // TODO: use "main-timeline-panel"
    return this.page.getByTestId('panel');
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
}
