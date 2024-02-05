import { expect, test } from '../fixtures';

test.beforeEach(async ({ tagExplorerPage }) => {
  await tagExplorerPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators', async ({ tagExplorerPage, toolbar }) => {
    await expect(tagExplorerPage.getTitle()).toHaveText('Tag explorer');
    await tagExplorerPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();
  });
});
