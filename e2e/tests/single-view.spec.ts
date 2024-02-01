import { expect, test } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title, spinners, dropdowns', async ({ singleViewPage }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single view');

    await singleViewPage.assertNoSpinners();

    await expect(singleViewPage.getServicesList()).toBeVisible();
    await expect(singleViewPage.getProfilesList()).toBeVisible();
  });
});
