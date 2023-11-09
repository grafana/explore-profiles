import { test, expect } from '../fixtures';

test.beforeEach(async ({ tagExplorerPage }) => {
  await tagExplorerPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getTitle()).toHaveText('Tag Explorer');
  });

  test('Spinners', async ({ tagExplorerPage }) => {
    await tagExplorerPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getServicesList()).toBeVisible();
    await expect(tagExplorerPage.getProfilesList()).toBeVisible();
  });
});
