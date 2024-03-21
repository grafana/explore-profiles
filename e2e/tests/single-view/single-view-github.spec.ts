import { expect, test } from '../../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

test.describe('GitHub integration', () => {
  test('Adds a "Function details" item after clicking on a flamegraph block', async ({ page, singleViewPage }) => {
    await singleViewPage.clickOnFlameGraphNode();

    const functionDetailsMenuItem = page.getByRole('menuitem', { name: 'Function details' });

    await expect(functionDetailsMenuItem).toBeVisible();
  });

  test('After clicking on "Function details", it opens a details panel', async ({ page, singleViewPage }) => {
    await singleViewPage.clickOnFlameGraphNode();

    const functionDetailsMenuItem = page.getByRole('menuitem', { name: 'Function details' });

    await functionDetailsMenuItem.click();

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
});
