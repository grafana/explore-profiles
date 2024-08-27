import { expect, type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class ExploreProfilesPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    const urlParams = new URLSearchParams(defaultUrlParams);

    super(page, '/a/grafana-pyroscope-app/profiles-explorer', urlParams.toString());
  }

  getDataSourceSelector() {
    return this.page.locator('#dataSource');
  }

  async assertSelectedDataSource(expectedDataSource: string) {
    const name = await this.getDataSourceSelector().textContent();
    await expect(name?.trim()).toBe(expectedDataSource);
  }

  getExplorationTypeSelector() {
    return this.page.getByTestId('exploration-types');
  }

  async asserSelectedExplorationType(expectedLabel: string) {
    const label = await this.getExplorationTypeSelector().locator('button[data-testid="is-active"]').textContent();
    await expect(label?.trim()).toBe(expectedLabel);
  }

  selectExplorationType(explorationType: string) {
    return this.getExplorationTypeSelector().getByLabel(explorationType).click();
  }

  getTimePicker() {
    return this.page.getByTestId('data-testid TimePicker Open Button');
  }

  async assertSelectedTimeRange(expectedTimeRange: string) {
    await expect(this.getTimePicker()).toContainText(expectedTimeRange);
  }

  getProfileTypeSelector() {
    return this.page.getByTestId('profileMetricId').locator('input');
  }

  async assertSelectedProfileType(expectedProfileType: string) {
    await expect(this.getProfileTypeSelector()).toHaveValue(expectedProfileType);
  }

  getServiceSelector() {
    return this.page.getByTestId('serviceName').locator('input');
  }

  async assertSelectedService(expectedService: string) {
    await expect(this.getServiceSelector()).toHaveValue(expectedService);
  }

  async selectProfileType(profileType: string) {
    const [category, type] = profileType.split('/');

    await this.getProfileTypeSelector().click();
    await this.page.getByText(category, { exact: true }).click();
    await this.page.getByText(type, { exact: true }).click();
  }

  getQuickFilterInput() {
    return this.page.getByLabel('Quick filter');
  }

  async assertQuickFilterValue(expectedValue: string) {
    await expect(this.getQuickFilterInput()).toHaveValue(expectedValue);
  }

  async enterQuickFilterText(searchText: string) {
    await this.getQuickFilterInput().fill(searchText);
    await this.waitForTimeout(250); // see SceneQuickFilter.DEBOUNCE_DELAY
  }

  getLayoutSwitcher() {
    return this.page.getByLabel('Layout switcher');
  }

  async assertSelectedLayout(expectedLayoutName: string) {
    const layoutName = await this.getLayoutSwitcher().locator('input[checked]~label').textContent();
    await expect(layoutName?.trim()).toBe(expectedLayoutName);
  }

  selectLayout(layoutName: string) {
    return this.getLayoutSwitcher().getByLabel(layoutName).click();
  }

  getSceneBody() {
    return this.page.getByTestId('sceneBody');
  }

  getPanelByTitle(title: string) {
    return this.getSceneBody().locator(`[data-viz-panel-key]:has([title="${title}"])`);
  }
}
