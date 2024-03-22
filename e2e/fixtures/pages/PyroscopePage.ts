import { expect, type Page, Request, Route } from '@playwright/test';

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

  locator(selector: string, options?: Record<string, unknown>) {
    return this.page.locator(selector, options);
  }

  getByTestid(testId: string | RegExp) {
    return this.page.getByTestId(testId);
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

  async assertNoLoadingPanels() {
    const slowExpect = expect.configure({ timeout: 10000 });

    const loadingPanels = this.page.getByLabel('Panel loading bar');
    const loadingPanelsCount = await loadingPanels.count();

    for (let i = 0; i < loadingPanelsCount; i += 1) {
      await slowExpect(loadingPanels.nth(i)).not.toBeVisible();
    }
  }

  async clickOnMenuItem(itemText: string) {
    // TODO: improve after upgrading Grafana version (which has a different navigation menu)
    await this.page.locator(`a:has-text("${itemText}")`).first().click();
  }

  waitForRequest(urlOrPredicate, options?) {
    return this.page.waitForRequest(urlOrPredicate, options);
  }

  waitForTimeout(timeout: number) {
    return this.page.waitForTimeout(timeout);
  }

  route(url: string, handler: (route: Route, request: Request) => any, options?: Record<string, any>) {
    return this.page.route(url, handler, options);
  }

  pause() {
    return this.page.pause();
  }
}
