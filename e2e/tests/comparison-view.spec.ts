import { test, expect } from '../fixtures';

test.beforeEach(async ({ comparisonViewPage }) => {
  await comparisonViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison view');
  });

  test('Spinners', async ({ comparisonViewPage }) => {
    await comparisonViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getServicesList()).toBeVisible();
    await expect(comparisonViewPage.getProfilesList()).toBeVisible();
  });

  test('Baseline & comparison panels', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonViewPage.getComparisonPanel()).toContainText('Comparison time range');
  });
});
