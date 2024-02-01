import { expect, test } from '../fixtures';

test.beforeEach(async ({ comparisonViewPage }) => {
  await comparisonViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, spinners, dropdowns, panels', async ({ comparisonViewPage }) => {
    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison view');

    await comparisonViewPage.assertNoSpinners();

    await expect(comparisonViewPage.getServicesList()).toBeVisible();
    await expect(comparisonViewPage.getProfilesList()).toBeVisible();

    await expect(comparisonViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonViewPage.getComparisonPanel()).toContainText('Comparison time range');
  });
});
