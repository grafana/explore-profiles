import { expect, type Page } from '@playwright/test';

import { DEFAULT_EXPLORE_PROFILES_URL_PARAMS, ExplorationType } from '../../config/constants';
import { PyroscopePage } from './PyroscopePage';

type Coords = {
  x: number;
  y: number;
};

export class ExploreProfilesPage extends PyroscopePage {
  constructor(readonly page: Page, defaultUrlParams: URLSearchParams) {
    const urlParams = new URLSearchParams(defaultUrlParams);

    super(page, '/a/grafana-pyroscope-app/explore', urlParams.toString());
  }

  goto(explorationType: ExplorationType, urlSearchParams = new URLSearchParams()) {
    const urlParams = new URLSearchParams({
      ...Object.fromEntries(DEFAULT_EXPLORE_PROFILES_URL_PARAMS),
      ...Object.fromEntries(urlSearchParams),
    });

    urlParams.set('explorationType', explorationType);

    return super.goto(urlParams.toString());
  }

  /* Data source */

  getDataSourceSelector() {
    return this.locator('#dataSource');
  }

  async assertSelectedDataSource(expectedDataSource: string) {
    const name = await this.getDataSourceSelector().textContent();
    await expect(name?.trim()).toBe(expectedDataSource);
  }

  /* Exploration type */

  getExplorationTypeSelector() {
    return this.getByTestId('exploration-types');
  }

  async asserSelectedExplorationType(expectedLabel: string) {
    const label = await this.getExplorationTypeSelector().locator('button[data-testid="is-active"]').textContent();
    await expect(label?.trim()).toBe(expectedLabel);
  }

  selectExplorationType(explorationType: string) {
    return this.getExplorationTypeSelector().getByLabel(explorationType).click();
  }

  /* Time picker/refresh */

  getTimePickerButton() {
    return this.getByTestId('data-testid TimePicker Open Button');
  }

  async assertSelectedTimeRange(expectedTimeRange: string) {
    await expect(this.getTimePickerButton()).toContainText(expectedTimeRange);
  }

  async selectTimeRange(quickRangeLabel: string) {
    await this.getTimePickerButton().click();
    await this.getByTestId('data-testid TimePicker Overlay Content').getByText(quickRangeLabel).click();
  }

  getRefreshPicker() {
    return this.getByTestId('data-testid RefreshPicker run button');
  }

  clickOnRefresh() {
    return this.getRefreshPicker().click();
  }

  /* Header elements */

  get recordingRulesButton() {
    return this.getByLabel('Recording rules');
  }

  clickOnViewRecordingRulesButton() {
    return this.recordingRulesButton.click();
  }

  get addRecordingRuleButton() {
    return this.getByLabel('Add recording rule');
  }

  async clickOnAddRecordingRuleButton() {
    return this.addRecordingRuleButton.click();
  }

  get recordingRulesModalServiceName() {
    return this.getByTestId('Create recording rule modal service name field');
  }

  get recordingRulesModalMetricName() {
    return this.getByLabel('Metric name', { type: 'input' });
  }

  get recordingRulesModalFunctionName() {
    return this.getByLabel('Function name', { type: 'input' });
  }

  async fillRecordingRuleForm(options: { metricName?: string; functionName?: string }) {
    if (options.metricName) {
      await this.recordingRulesModalMetricName.fill(options.metricName);
    }
    if (options.functionName) {
      await this.recordingRulesModalFunctionName.fill(options.functionName);
    }
  }

  async submitRecordingRuleForm() {
    await this.getByRole('button', { name: 'Create' }).click();
  }

  get recordingRulesDropdown() {
    return this.getByLabel('Recording rules');
  }

  get recordingRulesViewRecordingRules() {
    return this.getByLabel('View recording rules');
  }

  clickOnViewRecordingRulesDropdown() {
    return this.recordingRulesDropdown.click();
  }

  clickOnViewRecordingRulesViewRecordingRules() {
    return this.recordingRulesViewRecordingRules.click();
  }

  async goToRecordingRulesPage() {
    await this.clickOnViewRecordingRulesDropdown();
    await this.clickOnViewRecordingRulesViewRecordingRules();
  }

  async assertRecordingRuleInTable(metricName: string, functionName: string) {
    const table = this.getRecordingRulesTable();
    const row = table.locator('tr').filter({ hasText: metricName });
    await expect(row).toBeVisible();
    if (functionName) {
      await expect(row).toContainText(functionName);
    } else {
      await expect(row).toContainText('Total (all functions)');
    }
  }

  getRecordingRulesTable() {
    return this.page.locator('table');
  }

  /* Service */

  getServiceSelector() {
    return this.getByTestId('serviceName').locator('input');
  }

  async assertSelectedService(expectedService: string) {
    await expect(this.getServiceSelector()).toHaveValue(expectedService);
  }

  async selectService(serviceName: string) {
    await this.getServiceSelector().click();
    await this.locator('[role="menu"]').getByText(serviceName, { exact: true }).click();
  }

  /* Profile type */

  getProfileTypeSelector() {
    return this.getByTestId('profileMetricId').locator('input');
  }

  async assertSelectedProfileType(expectedProfileType: string) {
    await expect(this.getProfileTypeSelector()).toHaveValue(expectedProfileType);
  }

  async selectProfileType(profileType: string) {
    const [category, type] = profileType.split('/');

    await this.getProfileTypeSelector().click();

    const menu = this.locator('[role="menu"]').last();
    await menu.getByText(category, { exact: true }).click();
    await menu.getByText(type, { exact: true }).click();
  }

  async assertProfileTypeSelectorOptions(expectedCategories: string[], expectedTypesPerCategory: string[][]) {
    await this.getProfileTypeSelector().click();

    const menuItems = this.locator('[role="menu"] [role="menuitemcheckbox"]');
    const categories = await menuItems.allTextContents();

    expect(categories).toEqual(expectedCategories);

    for (let i = 0; i < categories.length; i += 1) {
      await menuItems.nth(i).click();

      const categoryTypes = await this.locator('[role="menu"]')
        .last()
        .locator('[role="menuitemcheckbox"]')
        .allTextContents();

      expect(categoryTypes).toEqual(expectedTypesPerCategory[i]);
    }
  }

  /* Quick filter */

  getQuickFilterInput() {
    return this.getByLabel('Quick filter');
  }

  async assertQuickFilter(explectedPlaceholder: string, expectedValue: string, expectedResultsCount: number) {
    await expect(await this.getQuickFilterInput().getAttribute('placeholder')).toBe(explectedPlaceholder);
    await expect(this.getQuickFilterInput()).toHaveValue(expectedValue);
    await this.assertQuickFilterResultsCount(expectedResultsCount);
  }

  async enterQuickFilterText(searchText: string) {
    await this.getQuickFilterInput().fill(searchText);
    await this.waitForTimeout(250); // see SceneQuickFilter.DEBOUNCE_DELAY
  }

  async assertQuickFilterResultsCount(expectedCount: number) {
    await expect(this.getByTestId('quick-filter-results-count')).toHaveText(String(expectedCount));
  }

  /* Layout switcher */

  getLayoutSwitcher() {
    return this.getByLabel('Layout switcher');
  }

  async assertSelectedLayout(expectedLayoutName: string) {
    const layoutName = await this.getLayoutSwitcher().locator('input[checked]~label').textContent();
    await expect(layoutName?.trim()).toBe(expectedLayoutName);
  }

  selectLayout(layoutName: string) {
    return this.getLayoutSwitcher().getByLabel(layoutName).click();
  }

  /* Hide panels without data switcher */

  getHideNoDataSwitcher() {
    return this.getByTestId('noDataSwitcher');
  }

  async assertHideNoDataSwitcher(isChecked: boolean) {
    if (isChecked) {
      await expect(this.getHideNoDataSwitcher()).toBeChecked();
    } else {
      await expect(this.getHideNoDataSwitcher()).not.toBeChecked();
    }
  }

  async selectHidePanelsWithoutNoData() {
    // weirdly the mouse is on the "Flame graph" panel action at this point
    // so we have to move it for the label to become actionable
    await this.mouse.move(0, 0);
    await this.getByLabel('Hide panels without data').click();
  }

  /* Panel type switcher */

  getPanelTypeSwitcher() {
    return this.getByLabel('Panel type switcher');
  }

  async assertSelectedPanelType(expectedPanelType: string) {
    const panelType = await this.getPanelTypeSwitcher().locator('input[checked]~label').textContent();
    await expect(panelType?.trim()).toBe(expectedPanelType);
  }

  selectPanelType(panelType: string) {
    return this.getPanelTypeSwitcher().getByLabel(panelType).click();
  }

  /* Scene body & grid panels */

  getSceneBody() {
    return this.getByTestId('sceneBody');
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

    // we have to move the mouse to prevent the action tooltip to cover (e.g.) the profile type selector
    await this.mouse.move(0, 0);
  }

  async assertPanelHasNoData(panelTitle: string) {
    await expect(this.getPanelByTitle(panelTitle).getByText('No data')).toBeVisible();
  }

  async assertNoSpinner() {
    await expect(this.getByTestId('Spinner')).toHaveCount(0);
  }

  /* Filters */

  getFilters(filterKey: string) {
    return this.locator(`#query-builder-${filterKey}`);
  }

  async assertFilters(expectedFilters: string[][], filterKey = 'filters') {
    const filters = this.getFilters(filterKey).getByTestId('filtersList').getByLabel('Filter', { exact: true });

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

  async addFilter(parts: string[], filterKey = 'filters') {
    await this.getFilters(filterKey).getByRole('combobox').click();

    const selectMenu = this.getByLabel('Select options menu');

    for (const part of parts) {
      await selectMenu.getByText(part, { exact: true }).click();
    }
  }

  /* Flame graph component */

  getExportDataButton() {
    return this.getByLabel('Export profile data');
  }

  getFlamegraph() {
    return this.getByTestId('flameGraph');
  }

  getTopTable() {
    return this.getByTestId('topTable');
  }

  clickOnFlameGraphNode({ x, y }: { x: number; y: number }) {
    return this.getFlamegraph().click({ position: { x, y } });
  }

  getFlameGraphContextualMenu() {
    return this.getByLabel('Context menu');
  }

  getFlameGraphContextualMenuItem(menuItemLabel: string) {
    return this.getFlameGraphContextualMenu().getByRole('menuitem', { name: menuItemLabel, exact: true });
  }

  closeFlameGraphContextualMenu() {
    return this.getByTestId('header-container').first().click();
  }

  /* Group by */

  getGroupByContainer() {
    return this.getByTestId('groupByLabelsContainer');
  }

  getGroupByPanels() {
    return this.getGroupByContainer().locator(`[data-viz-panel-key]`);
  }

  getGroupByLabelsSelector() {
    return this.getGroupByContainer().getByLabel('Labels selector', { exact: true });
  }

  async selectGroupByLabel(label: string) {
    await this.getGroupByLabelsSelector().getByLabel(label, { exact: true }).click();
  }

  getCompareButton() {
    return this.getGroupByContainer().getByRole('button', { name: 'Compare' });
  }

  getClearComparisonButton() {
    // getByRole('button', { name:... }) does not work :man_shrug:
    return this.getGroupByContainer().getByTestId('clearComparison');
  }

  getStatsPanel(labelValue: string) {
    return this.getGroupByContainer().getByTestId(`stats-panel-${labelValue}`);
  }

  async selectForComparison(panelTitle: string, target: string) {
    await this.getStatsPanel(panelTitle).getByText(target).click();
  }

  /* Diff panels */

  getComparisonPanel(target: 'baseline' | 'comparison') {
    return this.getByTestId(`panel-${target}`);
  }

  getComparisonTimePickerButton(target: 'baseline' | 'comparison') {
    return this.getByTestId(`panel-${target}`).getByTestId('data-testid TimePicker Open Button');
  }

  async selectComparisonTimeRange(target: 'baseline' | 'comparison', from: string, to: string) {
    await this.getComparisonTimePickerButton(target).click();

    const overlay = this.getByTestId('data-testid TimePicker Overlay Content');

    await overlay.getByTestId('data-testid Time Range to field').fill(to);
    await overlay.getByTestId('data-testid Time Range from field').fill(from);

    await overlay.getByTestId('data-testid TimePicker submit button').click();
  }

  async switchComparisonSelectionMode(target: 'baseline' | 'comparison', label: 'Time picker' | 'Flame graph') {
    await this.getComparisonPanel(target).getByLabel('Range selection mode').getByLabel(label).click();
  }

  async clickAndDragOnComparisonPanel(target: 'baseline' | 'comparison', coordsFrom: Coords, coordsTo: Coords) {
    const panel = this.getComparisonPanel(target);

    await panel.hover({ position: coordsFrom });
    await this.mouse.down();

    await panel.hover({ position: coordsTo });
    await this.mouse.up();
  }

  clickOnSyncTimerangesButton(target: 'baseline' | 'comparison') {
    return this.getComparisonPanel(target)
      .getByRole('button', { name: /^sync time ranges/i })
      .click();
  }
}
