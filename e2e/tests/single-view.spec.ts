import { test, expect } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ singleViewPage }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single View');
  });

  test('Refresh spinners', async ({ singleViewPage }) => {
    const refreshSpinners = singleViewPage.getRefreshSpinners();

    for (let i = 0; i < (await refreshSpinners.count()); i += 1) {
      await expect(refreshSpinners.nth(i)).not.toBeVisible();
    }
  });

  test('Main spinner', async ({ singleViewPage }) => {
    await expect(singleViewPage.getMainSpinner()).not.toBeVisible();
  });

  test('Service & profile dropdowns', async ({ singleViewPage }) => {
    await expect(singleViewPage.getServicesList()).toBeVisible();
    await expect(singleViewPage.getProfilesList()).toBeVisible();
  });
});
