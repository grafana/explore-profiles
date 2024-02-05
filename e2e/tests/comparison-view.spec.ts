import { expect, test } from '../fixtures';

test.beforeEach(async ({ comparisonViewPage }) => {
  await comparisonViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators, panels', async ({ comparisonViewPage, toolbar }) => {
    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison view');
    await comparisonViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(comparisonViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonViewPage.getComparisonPanel()).toContainText('Comparison time range');
  });
});
