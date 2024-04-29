import { type Page } from '@playwright/test';

type Position = {
  x: number;
  y: number;
};

export class Timeline {
  readonly page: Page;
  readonly panelSelector: string;

  constructor(page: Page, panelSelector: string) {
    this.page = page;
    this.panelSelector = panelSelector;
  }

  async clickAndDrag(fromPos: Position, toPos: Position) {
    const panel = this.page.locator(this.panelSelector);

    await panel.hover({ position: fromPos });
    await this.page.mouse.down();

    await panel.hover({ position: toPos });
    await this.page.mouse.up();
  }
}
