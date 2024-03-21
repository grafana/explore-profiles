import { expect, test } from '../fixtures';

test.describe('Regression bugs', () => {
  test('Tag Explorer page with infinite spinners (#179)', async ({ singleViewPage, tagExplorerPage, toolbar }) => {
    await singleViewPage.goto();

    await singleViewPage.assertNoLoadingPanels();
    await toolbar.assertNoSpinners();

    await singleViewPage.clickOnNavLink('Tab Tag Explorer');

    await tagExplorerPage.assertNoLoadingPanels();
    await toolbar.assertNoSpinners();
  });

  test('Labels disappear when going from comparison to diff view (#266)', async ({
    comparisonViewPage,
    comparisonDiffViewPage,
  }) => {
    const urlSearchParams = new URLSearchParams({
      query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
      from: '1710352800',
      until: '1710355800',
      groupBy: 'region',
      groupByValue: 'All',
      leftQuery: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app", region="ap-south"}',
      rightQuery: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app", region="us-east"}',
    });

    await comparisonViewPage.goto(urlSearchParams.toString());

    await expect(comparisonViewPage.getBaselineQueryBuilder()).toContainText(/region=ap-south/);
    await expect(comparisonViewPage.getComparisonQueryBuilder()).toContainText(/region=us-east/);

    await comparisonViewPage.clickOnMenuItem('Comparison Diff View');

    await expect(comparisonDiffViewPage.getBaselineQueryBuilder()).toContainText(/region=ap-south/);
    await expect(comparisonDiffViewPage.getComparisonQueryBuilder()).toContainText(/region=us-east/);
  });
});
