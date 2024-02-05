import { expect, test } from '../fixtures';

test.beforeEach(async ({ comparisonDiffViewPage }) => {
  await comparisonDiffViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators, panels', async ({ comparisonDiffViewPage, toolbar }) => {
    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison diff view');
    await comparisonDiffViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(comparisonDiffViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonDiffViewPage.getComparisonPanel()).toContainText('Comparison time range');
    await expect(comparisonDiffViewPage.getDiffPanel()).toBeVisible();
  });
});
