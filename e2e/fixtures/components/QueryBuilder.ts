import { type Page } from '@playwright/test';

export class QueryBuilder {
  readonly page: Page;
  readonly selector: string;

  constructor(page: Page, selector: string) {
    this.page = page;
    this.selector = selector;
  }

  get() {
    return this.page.locator(this.selector);
  }

  async addFilter(parts: any[]) {
    await this.get().getByRole('combobox').click();

    for (const part of parts) {
      await this.page.getByText(part, { exact: true }).click();
    }
  }

  async clickOnExecute() {
    await this.get().getByText('Execute').click();
  }
}
