import { test, expect } from '../fixtures';

test.beforeEach(async ({ comparisonDiffViewPage }) => {
  await comparisonDiffViewPage.goto();
});

// TODO: https://playwright.dev/docs/test-annotations#tag-tests
test.describe('Smoke tests', () => {
  test('Page title', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison diff view');
  });

  test('Spinners', async ({ comparisonDiffViewPage }) => {
    await comparisonDiffViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getServicesList()).toBeVisible();
    await expect(comparisonDiffViewPage.getProfilesList()).toBeVisible();
  });

  test('Baseline, comparison & diff panels', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonDiffViewPage.getComparisonPanel()).toContainText('Comparison time range');
    await expect(comparisonDiffViewPage.getDiffPanel()).toBeVisible();
  });
});
