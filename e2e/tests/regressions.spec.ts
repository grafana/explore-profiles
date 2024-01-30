import { expect, test } from '../fixtures';

test.describe('Regression bugs', () => {
  test('Tag Explorer page with infinite spinners (#179)', async ({ singleViewPage, tagExplorerPage }) => {
    await singleViewPage.goto();

    await singleViewPage.assertNoSpinners();

    await singleViewPage.clickOnNavLink('Tab Tag Explorer');

    await tagExplorerPage.assertNoSpinners();
  });

  test('Navigating to dashboard after Profiles and changing timerange', async ({ singleViewPage, page }) => {
    await singleViewPage.goto(''); // empty query params

    await singleViewPage.assertNoSpinners();

    await page.getByLabel('Toggle menu').click();
    await page.getByText('Dashboards').click();
    await page.getByText('E2E').click();
    await page.getByText('Simple dashboard').click();

    const timepicker = page.getByTestId('data-testid TimePicker Open Button');

    await expect(timepicker).toHaveText('Last 6 hours');

    await timepicker.click();
    await page.locator('ul[aria-roledescription="Time range selection"]').getByText('Last 1 hour').click();

    await expect(timepicker).toHaveText('Last 1 hour');
  });

  test('Labels disappear when going from comparison to diff view (#266)', async ({
    comparisonViewPage,
    comparisonDiffViewPage,
  }) => {
    const urlSearchParams = new URLSearchParams({
      query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope-rideshare-go"}',
      from: '1699689300',
      until: '1699704300',
      groupBy: 'region',
      groupByValue: 'All',
      leftQuery:
        'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope-rideshare-go", region="ap-south"}',
      rightQuery:
        'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope-rideshare-go", region="us-east"}',
    });

    await comparisonViewPage.goto(urlSearchParams.toString());

    await expect(comparisonViewPage.getBaselineQueryBuilder()).toContainText(/region=ap-south/);
    await expect(comparisonViewPage.getComparisonQueryBuilder()).toContainText(/region=us-east/);

    await comparisonViewPage.clickOnMenuItem('Comparison Diff View');

    await expect(comparisonDiffViewPage.getBaselineQueryBuilder()).toContainText(/region=ap-south/);
    await expect(comparisonDiffViewPage.getComparisonQueryBuilder()).toContainText(/region=us-east/);
  });
});
