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
  });

  // TODO: re-enable when we can upgrade to Grafana 12
  test.describe.skip('Metrics from profiles settings', () => {
    test('is not available by default', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      await expect(exploreProfilesPage.viewRecordingRulesButton).not.toBeVisible();

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).not.toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).not.toBeVisible();
    });

    test('can be enabled', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getMetricsFromProfilesCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      await expect(exploreProfilesPage.viewRecordingRulesButton).toBeVisible();

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 10 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Create recording rule')).toBeVisible();
    });
  });

  test.describe('Flame graph settings', () => {
    test('Can be modified', async ({ settingsPage, exploreProfilesPage }) => {
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

      // tweak max diff pixel ratio because sometimes the screenshot is 1px bigger in height
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });

      // diff flame graph
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand group')).toBeVisible();
      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Expand all groups')).toBeVisible();

      await exploreProfilesPage.closeFlameGraphContextualMenu();

      // tweak max diff pixel ratio because sometimes the screenshot is 1px bigger in height
      await expect(exploreProfilesPage.getFlamegraph()).toHaveScreenshot({
        maxDiffPixelRatio: 0.02,
      });
    });
  });
});
