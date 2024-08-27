import { expect, type Page } from '@playwright/test';

import { DEFAULT_EXPLORE_PROFILES_URL_PARAMS } from '../../config/constants';
import { PyroscopePage } from './PyroscopePage';

export class ExploreProfilesPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    const urlParams = new URLSearchParams(defaultUrlParams);

    super(page, '/a/grafana-pyroscope-app/profiles-explorer', urlParams.toString());
  }

  goto(explorationType?: string) {
    if (!explorationType) {
      return super.goto();
    }

    const urlParams = new URLSearchParams(DEFAULT_EXPLORE_PROFILES_URL_PARAMS);
    urlParams.set('explorationType', explorationType);

    return super.goto(urlParams.toString());
  }

  /* Data source */

  getDataSourceSelector() {
    return this.page.locator('#dataSource');
  }

  async assertSelectedDataSource(expectedDataSource: string) {
    const name = await this.getDataSourceSelector().textContent();
    await expect(name?.trim()).toBe(expectedDataSource);
  }

  /* Exploration type */

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

  /* Time picker */

  getTimePicker() {
    return this.page.getByTestId('data-testid TimePicker Open Button');
  }

  async assertSelectedTimeRange(expectedTimeRange: string) {
    await expect(this.getTimePicker()).toContainText(expectedTimeRange);
  }

  /* Profile type */

  getProfileTypeSelector() {
    return this.page.getByTestId('profileMetricId').locator('input');
  }

  async assertSelectedProfileType(expectedProfileType: string) {
    await expect(this.getProfileTypeSelector()).toHaveValue(expectedProfileType);
  }

  async selectProfileType(profileType: string) {
    const [category, type] = profileType.split('/');

    await this.getProfileTypeSelector().click();
    await this.page.getByText(category, { exact: true }).click();
    await this.page.getByText(type, { exact: true }).click();
  }

  /* Service */

  getServiceSelector() {
    return this.page.getByTestId('serviceName').locator('input');
  }

  async assertSelectedService(expectedService: string) {
    await expect(this.getServiceSelector()).toHaveValue(expectedService);
  }

  async selectService(serviceName: string) {
    await this.getServiceSelector().click();
    await this.page.getByText(serviceName, { exact: true }).click();
  }

  /* Quick filter */

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

  /* Layout switcher */

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

  /* Scene body & grid panels */

  getSceneBody() {
    return this.page.getByTestId('sceneBody');
  }

  getPanelByTitle(title: string) {
    return this.getSceneBody().locator(`[data-viz-panel-key]:has([title="${title}"])`);
  }

  getPanels() {
    return this.getSceneBody().locator(`[data-viz-panel-key]`);
  }

  async clickOnPanelAction(panelTitle: string, actionLabel: string) {
    const panel = await this.getPanelByTitle(panelTitle);
    await panel.getByLabel(actionLabel).click();
  }

  /* Filters */

  getFilters() {
    return this.page.getByTestId('filters');
  }

  async assertFilters(expectedFilters: string[][]) {
    const filters = this.getFilters().getByTestId('filtersList').getByLabel('Filter', { exact: true });

    await expect(filters).toHaveCount(expectedFilters.length);

    for (let i = 0; i < expectedFilters.length; i += 1) {
      const [expectedLabel, expectedOperator, expectedValue] = expectedFilters[i];

      const filter = filters.nth(0);
      const filterParts = filter.locator('button');

      await expect(filterParts.nth(0)).toHaveText(expectedLabel);
      await expect(filterParts.nth(1)).toHaveText(expectedOperator);
      await expect(filterParts.nth(2)).toHaveText(expectedValue);
    }
  }

  async addFilter(parts: string[]) {
    await this.getFilters().getByRole('combobox').click();

    const selectMenu = this.page.getByLabel('Select options menu');

    for (const part of parts) {
      await selectMenu.getByText(part, { exact: true }).click();
    }
  }
}
