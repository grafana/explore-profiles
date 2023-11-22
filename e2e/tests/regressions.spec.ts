import { test, expect } from '../fixtures';

test.describe('Regression bugs', () => {
  test('Tag Explorer page with infinite spinners (#179)', async ({ singleViewPage, tagExplorerPage }) => {
    await singleViewPage.goto();

    await singleViewPage.assertNoSpinners();

    await singleViewPage.clickOnNavLink('Tab Tag Explorer');

    await tagExplorerPage.assertNoSpinners();
  });

  test('Navigating to dashboard after Prolifes and changing timerange', async ({ singleViewPage, page }) => {
    await singleViewPage.goto(''); // empty query params

    await singleViewPage.assertNoSpinners();

    await page.getByLabel('Toggle menu').click();
    await page.getByText('Dashboards').click();
    await page.getByText('E2E').click();
    await page.getByText('Simple dashboard').click();

    await page.getByText('Simple panel');

    const timepicker = page.getByTestId('data-testid TimePicker Open Button');

    await expect(timepicker).toHaveText('Last 6 hours');

    await timepicker.click();
    await page.locator('ul[aria-roledescription="Time range selection"]').getByText('Last 1 hour').click();

    await expect(timepicker).toHaveText('Last 1 hour');
  });
});
