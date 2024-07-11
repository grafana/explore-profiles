import { expect, test } from '../fixtures';

test.beforeEach(async ({ settingsPage }) => {
  await settingsPage.goto();
});

test.afterEach(async ({ settingsPage }) => {
  await settingsPage.resetTestSettings();
});

test.describe('Plugin Settings', () => {
  // prevents unwanted settings modifications while running multiple tests in parallel
  test.describe.configure({ mode: 'serial' });

  test.describe('Smoke tests', () => {
    test('Flame graph & Export settings', async ({ settingsPage }) => {
      const flamegraphSettings = settingsPage.getFlamegraphSettings();

      await expect(flamegraphSettings).toBeVisible();
      await expect(flamegraphSettings.getByText('Collapsed flame graphs')).toBeVisible();
      await expect(flamegraphSettings.getByText('Maximum number of nodes')).toBeVisible();

      const exportSettings = settingsPage.getExportSettings();

      await expect(exportSettings).toBeVisible();
      await expect(exportSettings.getByText('Enable flamegraph.com')).toBeVisible();
    });
  });

  test.describe('Flame graph settings', () => {
    test('Can be modified', async ({ settingsPage, comparisonDiffViewPage }) => {
      await settingsPage.resetTestSettings();

      await settingsPage.getCollapsedFlamegraphsCheckbox().click();
      await settingsPage.getMaxNodesInput().fill('4');
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await comparisonDiffViewPage.goto();
      await expect(comparisonDiffViewPage.getFlamegraph()).toHaveScreenshot();
    });
  });

  test.describe('Export settings', () => {
    test('Can be modified', async ({ settingsPage, comparisonDiffViewPage }) => {
      await settingsPage.resetTestSettings();

      await settingsPage.getEnableFlamegraphDotComCheckbox().click();
      await settingsPage.getSaveSettingsButton().click();
      await expect(settingsPage.getSuccessAlertDialog()).toBeVisible();

      await comparisonDiffViewPage.goto();
      await comparisonDiffViewPage.getExportDataButton().click();
      await expect(comparisonDiffViewPage.getByText('flamegraph.com')).not.toBeVisible();
    });
  });
});
