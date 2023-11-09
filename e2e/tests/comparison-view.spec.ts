import { test, expect } from '../fixtures';

test.beforeEach(async ({ comparisonViewPage }) => {
  await comparisonViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison View');
  });

  test('Spinners', async ({ comparisonViewPage }) => {
    await comparisonViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getServicesList()).toBeVisible();
    await expect(comparisonViewPage.getProfilesList()).toBeVisible();
  });

  test('Baseline & comparison columns', async ({ comparisonViewPage }) => {
    const camparisonContainer = comparisonViewPage.getComparisonContainer();

    await expect(camparisonContainer).toContainText('Baseline time range');
    await expect(camparisonContainer).toContainText('Comparison time range');
  });
});
