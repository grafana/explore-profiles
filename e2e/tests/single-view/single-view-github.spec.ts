import { expect, test } from '../../fixtures';

test.describe('GitHub integration', () => {
  test('Adds a "Function details" item when clicking on a flamegraph node', async ({ singleViewPage }) => {
    await singleViewPage.goto();

    await singleViewPage.clickOnFlameGraphNode();

    await expect(singleViewPage.getFunctionDetailsMenuItem()).toBeVisible();
  });

  test('After clicking on "Function details", it opens a details panel', async ({ singleViewPage }) => {
    await singleViewPage.goto();

    await singleViewPage.clickOnFlameGraphNode();
    await singleViewPage.clickOnFunctionDetailsMenuItem();

    const detailsPanel = singleViewPage.getByTestid('function-details-panel');

    await expect(detailsPanel).toBeVisible();
    await expect(detailsPanel.getByText('Function Details')).toBeVisible();

    const functionNameRow = detailsPanel.getByTestId('row-function-name');
    await expect(functionNameRow.getByText('Function name')).toBeVisible();
    await expect(functionNameRow.locator('span')).toHaveText('github.com/grafana/pyroscope-rideshare-go/car.OrderCar');

    const startLineRow = detailsPanel.getByTestId('row-start-line');
    await expect(startLineRow.getByText('Start line')).toBeVisible();
    await expect(startLineRow.locator('span')).toHaveText('10');

    const filePathRow = detailsPanel.getByTestId('row-file-path');
    await expect(filePathRow.getByText('File')).toBeVisible();
    await expect(filePathRow.locator('span')).toHaveText('go/src/app/car/car.go/');

    const repositoryRow = detailsPanel.getByTestId('row-repository');
    await expect(repositoryRow.getByText('Repository')).toBeVisible();
    await expect(repositoryRow.getByText('Connect to grafana/pyroscope-rideshare-go')).toBeVisible();

    const commitRow = detailsPanel.getByTestId('row-commit');
    await expect(commitRow.getByText('Commit')).toBeVisible();

    const codeContainer = detailsPanel.getByTestId('function-details-code-container');
    await expect(codeContainer.getByText('Breakdown per line')).toBeVisible();
    await expect(codeContainer.getByText('View on GitHub')).toBeVisible();
    await expect(codeContainer.getByTestId('function-details-code')).toHaveScreenshot();
  });

  test('When a relative timerange is selected, it uses the same fixed timerange for querying the flamegraph & function details', async ({
    singleViewPage,
  }) => {
    let renderParams = '';

    await singleViewPage.route('**/resources/pyroscope/render?*', async (route, request) => {
      const { searchParams } = new URL(request.url());
      renderParams = `${searchParams.get('from')}-${searchParams.get('until')}`;
      await route.continue();
    });

    const urlSearchParams = new URLSearchParams({
      from: 'now-1m',
      until: 'now',
      query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
    });

    await singleViewPage.goto(urlSearchParams.toString());

    await singleViewPage.waitForTimeout(1000);

    await singleViewPage.clickOnFlameGraphNode({ x: 110, y: 30 });

    const [profileRequest] = await Promise.all([
      singleViewPage.waitForRequest('**/resources/querier.v1.QuerierService/SelectMergeProfile'),
      singleViewPage.clickOnFunctionDetailsMenuItem(),
    ]);

    const { start, end } = profileRequest.postDataJSON();

    expect(renderParams).toBe(`${start}-${end}`);
  });
});
