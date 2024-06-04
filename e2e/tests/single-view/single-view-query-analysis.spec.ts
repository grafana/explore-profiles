import { expect, test } from '../../fixtures';

test.describe('Query analysis tooltip', () => {
  test('Query analysis text is visible', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await expect(singleViewPage.getTitle()).toHaveText('Single view');
    await singleViewPage.assertNoLoadingPanels();
    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    let queryAnalysisSpan = await singleViewPage.getQueryAnalysisSpan();
    await expect(queryAnalysisSpan).toContainText('Stored data in time range:');
  });

  test('Query analysis tooltip opens on click', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await singleViewPage.assertNoLoadingPanels();
    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();
    let queryAnalysisSpan = await singleViewPage.getQueryAnalysisSpan();

    await queryAnalysisSpan.click();
    let queryAnalysisPopup = singleViewPage.getByTestid('queryAnalysis-popup');
    await expect(queryAnalysisPopup).toBeVisible();
    await expect(queryAnalysisPopup).toContainText('Data in time range');
  });
});
