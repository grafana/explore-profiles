import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class SingleViewPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: string) {
    super(page, '/a/grafana-pyroscope-app/single', defaultUrlParams);
  }
}