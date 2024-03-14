import { expect, test } from '../../fixtures';

// This file is just provided as a basis for the future
// TODO: add all the required things to the E2E Docker files for these E2E tests to work
// TODO: implmenent the login process

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

const FLAMEGRAPH_BLOCK_COORDS = {
  x: 179,
  y: 96,
};

test.describe('GitHub integration', () => {
  test('Adds a "Function details" item after clicking on a flamegraph block', async ({ page, singleViewPage }) => {
    await singleViewPage.getFlamegraph().click({
      position: FLAMEGRAPH_BLOCK_COORDS,
    });

    const functionDetailsMenuItem = page.getByRole('menuitem', { name: 'Function details' });

    await expect(functionDetailsMenuItem).toBeVisible();
  });

  test('After clicking on "Function details", it opens a details panel', async ({ page, singleViewPage }) => {
    await singleViewPage.getFlamegraph().click({
      position: FLAMEGRAPH_BLOCK_COORDS,
    });

    const functionDetailsMenuItem = page.getByRole('menuitem', { name: 'Function details' });

    await functionDetailsMenuItem.click();

    const detailsPanel = singleViewPage.getByTestid('github-function-details-panel');

    await expect(detailsPanel).toBeVisible();
    await expect(detailsPanel.getByText('Function Details')).toBeVisible();
    await expect(detailsPanel.getByText('Function name')).toBeVisible();
    await expect(detailsPanel.getByText('Start line')).toBeVisible();
    await expect(detailsPanel.getByText('File')).toBeVisible();
    await expect(detailsPanel.getByText('Repository')).toBeVisible();
    await expect(detailsPanel.getByText('Commit')).toBeVisible();
    await expect(detailsPanel.getByText('Breakdown per line')).toBeVisible();
    await expect(detailsPanel.getByText('View on GitHub')).toBeVisible();
  });
});
