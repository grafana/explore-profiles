import { test, expect } from '../fixtures';

test.beforeEach(async ({ comparisonDiffViewPage }) => {
  await comparisonDiffViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison Diff View');
  });

  test('Refresh spinners', async ({ comparisonDiffViewPage }) => {
    const refreshSpinners = comparisonDiffViewPage.getRefreshSpinners();

    for (let i = 0; i < (await refreshSpinners.count()); i += 1) {
      await expect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  });

  test('Main spinner', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getMainSpinner()).not.toBeVisible();
  });

  test('Service & profile dropdowns', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getServicesList()).toBeVisible();
    await expect(comparisonDiffViewPage.getProfilesList()).toBeVisible();
  });

  test('Baseline, comparison & diff columns', async ({ comparisonDiffViewPage }) => {
    const camparisonContainer = comparisonDiffViewPage.getComparisonContainer();

    await expect(camparisonContainer).toContainText('Baseline time range');
    await expect(camparisonContainer).toContainText('Comparison time range');

    await expect(comparisonDiffViewPage.getDiffContainer()).toContainText('Baseline vs. Comparison Diff');
  });
});
