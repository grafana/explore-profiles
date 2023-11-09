import { test } from '../fixtures';

test.describe('Regression bugs', () => {
  test('Tag Explorer page with infinite spinners (#179)', async ({ singleViewPage, tagExplorerPage }) => {
    await singleViewPage.goto();

    await singleViewPage.assertNoSpinners();

    await singleViewPage.clickOnNavLink('Tab Tag Explorer');

    await tagExplorerPage.assertNoSpinners();
  });
});
