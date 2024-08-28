import { ExplorationType, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.beforeEach(async ({ settingsPage }) => {
  await settingsPage.goto();
});

test.afterEach(async ({ settingsPage }) => {
  await settingsPage.resetTestSettings(false);
});

test.describe('Plugin Settings', () => {
  // prevents unwanted settings modifications while running multiple tests in parallel
  test.describe.configure({ mode: 'serial' });

  test('Main UI elements', async ({ settingsPage }) => {
    const flamegraphSettings = settingsPage.getFlamegraphSettings();

    await expect(flamegraphSettings).toBeVisible();
    await expect(flamegraphSettings.getByText('Collapsed flame graphs')).toBeVisible();
    await expect(flamegraphSettings.getByText('Maximum number of nodes')).toBeVisible();

    const exportSettings = settingsPage.getExportSettings();

    await expect(exportSettings).toBeVisible();
    await expect(exportSettings.getByText('Enable flamegraph.com')).toBeVisible();
  });

  test.describe('Flame graph settings', () => {
    test('Can be modified for the "Flame graph" view', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.resetTestSettings();

      await settingsPage.getCollapsedFlamegraphsCheckbox().click();
      await settingsPage.getMaxNodesInput().fill('4');
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      // flame graph
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand group')).toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand all groups')).toBeVisible();

      await exploreProfilesPage.closeFlameGraphContextualMenu();
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot();

      // diff flame graph
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand group')).toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand all groups')).toBeVisible();

      await exploreProfilesPage.closeFlameGraphContextualMenu();
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot();
    });
  });

  test.describe('Export settings', () => {
    test('Can be modified', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.resetTestSettings();

      await settingsPage.getEnableFlamegraphDotComCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      // flame graph
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      await exploreProfilesPage.getExportDataButton().click();

      await expect(exploreProfilesPage.getByText('flamegraph.com')).not.toBeVisible();

      // diff flame graph
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);
      await exploreProfilesPage.getExportDataButton().click();

      await expect(exploreProfilesPage.getByText('flamegraph.com')).not.toBeVisible();
    });
  });
});
