import { test, expect } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title', async ({ singleViewPage }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single View');
  });

  test('Spinners', async ({ singleViewPage }) => {
    await singleViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ singleViewPage }) => {
    await expect(singleViewPage.getServicesList()).toBeVisible();
    await expect(singleViewPage.getProfilesList()).toBeVisible();
  });
});
