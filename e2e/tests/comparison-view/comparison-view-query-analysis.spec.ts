import { expect, test } from '../../fixtures';

test.describe.skip('Query analysis tooltip', () => {
  test('Query analysis text is visible and the tooltip opens on click', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();

    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison view');
    await comparisonViewPage.assertNoLoadingPanels();
    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    let queryAnalysisSpan = await comparisonViewPage.getQueryAnalysisSpan();
    await expect(queryAnalysisSpan).toContainText('Stored data in time range:');

    await queryAnalysisSpan.click();
    let queryAnalysisPopup = comparisonViewPage.getByTestid('queryAnalysis-popup');
    await expect(queryAnalysisPopup).toBeVisible();
    await expect(queryAnalysisPopup).toContainText('Data in time range');
  });
});
