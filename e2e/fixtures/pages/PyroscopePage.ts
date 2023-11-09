import { type Page } from '@playwright/test';

export class PyroscopePage {
  readonly page: Page;
  pathname: string;

  constructor(page: Page, pathname: string) {
    this.page = page;
    this.pathname = pathname;
  }

  async goto() {
    await this.page.goto(this.pathname);
    await this.page.locator('.pyroscope-app').waitFor();
  }

  getTitle() {
    return this.page.getByTestId('page-title');
  }

  getRefreshSpinners() {
    return this.page.getByTestId('data-testid RefreshPicker run button').locator('i.fa-spinner');
  }

  getMainSpinner() {
    // TODO: improve with proper loading indicators
    return this.page.locator('.pyroscope-app').getByText('Loading');
  }

  getServicesList() {
    return this.page.getByLabel('Services list');
  }

  getProfilesList() {
    return this.page.getByLabel('Profiles list');
  }
}
