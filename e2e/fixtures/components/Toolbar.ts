import { expect, type Page } from '@playwright/test';

export class Toolbar {
  readonly page: Page;

  constructor(page) {
    this.page = page;
  }

  get() {
    return this.page.getByTestId('toolbar');
  }

  async assertVisible() {
    await expect(this.getServicesDropdown()).toBeVisible();
    await expect(this.getProfileTypesDropdown()).toBeVisible();
    await expect(this.getTimePicker()).toBeVisible();
  }

  getServicesDropdown() {
    return this.get().getByTestId('services-dropdown');
  }

  async selectService(service: string) {
    await this.getServicesDropdown().locator('input').click();
    await this.page.getByText(service, { exact: true }).click();
  }

  getProfileTypesDropdown() {
    return this.get().getByTestId('profile-types-dropdown');
  }

  async selectProfileType(profileType: string) {
    await this.getProfileTypesDropdown().locator('input').click();
    await this.page.getByText(profileType, { exact: true }).click();
  }

  getTimePicker() {
    return this.get().getByTestId('data-testid TimePicker Open Button');
  }

  async zoomOutTimeRange() {
    await this.get().getByLabel('Zoom out time range').click();
  }

  async moveTimeRangeBackwards() {
    await this.get().getByLabel('Move time range backwards').click();
  }

  async moveTimeRangeForwards() {
    await this.get().getByLabel('Move time range forwards').click();
  }

  async assertNoSpinners() {
    const slowExpect = expect.configure({ timeout: 10000 });

    const refreshSpinners = this.page.getByTestId('data-testid RefreshPicker run button').locator('i.fa-spinner');
    const spinnersCount = await refreshSpinners.count();

    for (let i = 0; i < spinnersCount; i += 1) {
      await slowExpect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  }
}
