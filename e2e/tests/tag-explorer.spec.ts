import { test, expect } from '../fixtures';

test.beforeEach(async ({ tagExplorerPage }) => {
  await tagExplorerPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getTitle()).toHaveText('Tag Explorer');
  });

  test('Refresh spinners', async ({ tagExplorerPage }) => {
    const refreshSpinners = tagExplorerPage.getRefreshSpinners();

    for (let i = 0; i < (await refreshSpinners.count()); i += 1) {
      await expect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  });

  test('Main spinner', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getMainSpinner()).not.toBeVisible();
  });

  test('Service & profile dropdowns', async ({ tagExplorerPage }) => {
    await expect(tagExplorerPage.getServicesList()).toBeVisible();
    await expect(tagExplorerPage.getProfilesList()).toBeVisible();
  });
});
