import { expect, test } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

// TODO: when panel is loading (e.g. timeline panel), we have:
// <div aria-label="Panel loading bar" class="css-132bufy"></div>

test.describe('Smoke tests', () => {
  test('Page title, spinners, dropdowns', async ({ singleViewPage }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single view');

    await singleViewPage.assertNoSpinners();

    await expect(singleViewPage.getServicesList()).toBeVisible();
    await expect(singleViewPage.getProfilesList()).toBeVisible();
  });
});
