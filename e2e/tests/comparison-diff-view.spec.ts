import { expect, test } from '../fixtures';

test.beforeEach(async ({ comparisonDiffViewPage }) => {
  await comparisonDiffViewPage.goto();
});

// TODO: https://playwright.dev/docs/test-annotations#tag-tests
test.describe('Smoke tests', () => {
  test('Page title, spinners, dropdowns, panels', async ({ comparisonDiffViewPage }) => {
    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison diff view');

    await comparisonDiffViewPage.assertNoSpinners();

    await expect(comparisonDiffViewPage.getServicesList()).toBeVisible();
    await expect(comparisonDiffViewPage.getProfilesList()).toBeVisible();

    await expect(comparisonDiffViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonDiffViewPage.getComparisonPanel()).toContainText('Comparison time range');
    await expect(comparisonDiffViewPage.getDiffPanel()).toBeVisible();
  });
});
