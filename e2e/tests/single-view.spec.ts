import { expect, test } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

// TODO: when panel is loading (e.g. timeline panel), we have:
// <div aria-label="Panel loading bar" class="css-132bufy"></div>

test.describe('Smoke tests', () => {
  test('Page title', async ({ singleViewPage }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single view');
  });

  test('Spinners', async ({ singleViewPage }) => {
    await singleViewPage.assertNoSpinners();
  });

  test('Service & profile dropdowns', async ({ singleViewPage }) => {
    await expect(singleViewPage.getServicesList()).toBeVisible();
    await expect(singleViewPage.getProfilesList()).toBeVisible();
  });
});
