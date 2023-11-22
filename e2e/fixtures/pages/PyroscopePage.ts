import { type Page, expect } from '@playwright/test';

export class PyroscopePage {
  readonly page: Page;
  pathname: string;
  urlParams: string;

  constructor(page: Page, pathname: string, urlParams: string) {
    this.page = page;
    this.pathname = pathname;
    this.urlParams = urlParams;
  }

  async goto(urlParams: string | undefined = undefined) {
    const url = urlParams !== undefined ? `${this.pathname}?${urlParams}` : `${this.pathname}?${this.urlParams}`;

    await this.page.goto(url);
    await this.page.locator('.pyroscope-app').waitFor();
  }

  clickOnNavLink(label: string) {
    return this.page.getByLabel(label).click();
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

  async assertNoSpinners() {
    await expect(this.getMainSpinner()).not.toBeVisible();

    const refreshSpinners = this.getRefreshSpinners();
    const spinnersCount = await refreshSpinners.count();

    for (let i = 0; i < spinnersCount; i += 1) {
      await expect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  }
}
