import { type Page } from '@playwright/test';
import { PyroscopePage } from './PyroscopePage';

export class SingleViewPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/single');
  }
}
