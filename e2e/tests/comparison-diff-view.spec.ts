import { test, expect } from '../fixtures';

test.beforeEach(async ({ comparisonDiffViewPage }) => {
  await comparisonDiffViewPage.goto();
});

// TODO: https://playwright.dev/docs/test-annotations#tag-tests
test.describe('Smoke tests', () => {
  test('Page title', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison Diff View');
  });

  test('Spinners', async ({ comparisonDiffViewPage }) => {
    await comparisonDiffViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getServicesList()).toBeVisible();
    await expect(comparisonDiffViewPage.getProfilesList()).toBeVisible();
  });

  test('Baseline, comparison & diff columns', async ({ comparisonDiffViewPage }) => {
    const camparisonContainer = comparisonDiffViewPage.getComparisonContainer();

    await expect(camparisonContainer.locator('h6').nth(0)).toContainText('Baseline time range');
    await expect(camparisonContainer.locator('h6').nth(1)).toContainText('Comparison time range');
  });
});
