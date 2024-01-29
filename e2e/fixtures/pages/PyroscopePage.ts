import { expect, type Page } from '@playwright/test';

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

  getByText(text, options?: Record<string, unknown>) {
    return this.page.getByText(text, options);
  }

  getByRole(role, options?: Record<string, unknown>) {
    return this.page.getByRole(role, options);
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
    return this.page.locator('.pyroscope-app').getByText('Loading').first();
  }

  getServicesList() {
    return this.page.getByLabel('Services list');
  }

  getProfilesList() {
    return this.page.getByLabel('Profiles list');
  }

  async assertNoSpinners() {
    const slowExpect = expect.configure({ timeout: 10000 });

    await slowExpect(this.getMainSpinner()).not.toBeVisible();

    const refreshSpinners = this.getRefreshSpinners();
    const spinnersCount = await refreshSpinners.count();

    for (let i = 0; i < spinnersCount; i += 1) {
      await slowExpect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  }

  async clickOnMenuItem(itemText: string) {
    // TODO: improve after upgrading Grafana version (which has a different navigation menu)
    await this.page.locator(`a:has-text("${itemText}")`).first().click();
  }
}
