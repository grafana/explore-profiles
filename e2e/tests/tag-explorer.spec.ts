import { expect, test } from '../fixtures';

test.beforeEach(async ({ tagExplorerPage }) => {
  await tagExplorerPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, spinners, dropdowns', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getTitle()).toHaveText('Tag explorer');

    await tagExplorerPage.assertNoSpinners();

    await expect(tagExplorerPage.getServicesList()).toBeVisible();
    await expect(tagExplorerPage.getProfilesList()).toBeVisible();
  });
});
