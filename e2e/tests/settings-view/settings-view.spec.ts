import { ExplorationType } from '../../config/constants';
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

  test.describe('Flame graph settings', () => {
    test('Can be modified', async ({ settingsPage, exploreProfilesPage }) => {
      await settingsPage.getCollapsedFlamegraphsCheckbox().click();
      await settingsPage.getMaxNodesInput().fill('4');
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await exploreProfilesPage.goto(ExplorationType.FlameGraph);
      const flamegraph = exploreProfilesPage.getFlamegraph();
      await expect(flamegraph).toBeVisible();

      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 50 });
      await expect(exploreProfilesPage.getFlameGraphContextualMenu()).toBeVisible();
      expect(
        await exploreProfilesPage.getFlameGraphContextualMenu().getByRole('menuitem').count()
      ).toBeGreaterThanOrEqual(2);
      await exploreProfilesPage.closeFlameGraphContextualMenu();

      const h = await flamegraph.evaluate((el) => (el as HTMLElement).offsetHeight);
      if (h < 300) {
        await expect(flamegraph).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });
      }
    });
  });
});
