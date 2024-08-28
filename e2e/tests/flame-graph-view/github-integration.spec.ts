import { ExplorationType } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('Flame graph view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.FlameGraph);
  });

  test.describe('GitHub Integration', () => {
    test('Adds a "Function details" item when clicking on a flame graph node', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 160 });

      await expect(exploreProfilesPage.getFlameGraphContextualMenuItem('Function details')).toBeVisible();
    });

    test('After clicking on "Function details", it opens a details panel', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 160 });
      await exploreProfilesPage.getFlameGraphContextualMenuItem('Function details').click();

      const detailsPanel = exploreProfilesPage.getByTestId('function-details-panel');

      await expect(detailsPanel).toBeVisible();
      await expect(detailsPanel.getByText('Function Details')).toBeVisible();

      const functionNameRow = detailsPanel.getByTestId('row-function-name');
      await expect(functionNameRow.getByText('Function name')).toBeVisible();
      await expect(functionNameRow.locator('span')).toHaveText(
        'github.com/grafana/pyroscope-rideshare-go/car.OrderCar'
      );

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

      await expect(codeContainer.getByTestId('function-details-code')).toHaveScreenshot(
        'GitHub-integration-After-clicking-on-Function-details-it-opens-a-details-panel-1.png'
      );
    });

    test('The details panel is automatically closed when loading new data', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnFlameGraphNode({ x: 250, y: 160 });
      await exploreProfilesPage.getFlameGraphContextualMenuItem('Function details').click();

      await expect(exploreProfilesPage.getByTestId('function-details-panel')).toBeVisible();

      exploreProfilesPage.selectProfileType('memory/alloc_space');

      await expect(exploreProfilesPage.getByTestId('function-details-panel')).not.toBeVisible();
    });
  });
});
