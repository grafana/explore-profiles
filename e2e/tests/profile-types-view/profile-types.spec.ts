import { expect, test } from '../../fixtures';

test.describe('Profile types view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto('profiles');
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('Profile types');
    await exploreProfilesPage.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

    // body scene controls
    await exploreProfilesPage.assertSelectedService('ride-sharing-app');
    await exploreProfilesPage.assertQuickFilterValue('');
    await exploreProfilesPage.assertSelectedLayout('Grid');

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
  });

  test('Service selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectService('pyroscope');

    await exploreProfilesPage.assertSelectedService('pyroscope');

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
    });
  });

  test('Quick filter', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.enterQuickFilterText('samples,alloc_space');

    await expect(exploreProfilesPage.getPanels()).toHaveCount(2);
    await expect(exploreProfilesPage.getPanelByTitle('samples (process_cpu)')).toBeVisible();
    await expect(exploreProfilesPage.getPanelByTitle('alloc_space (memory)')).toBeVisible();
  });

  test('Layout switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectLayout('Rows');

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
    });
  });

  test.describe('Panel actions', () => {
    test('Labels action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('alloc_space (memory)');
      await panel.getByLabel('Labels').click();

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/alloc_space');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
      });
    });

    test('Flame graph action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('alloc_space (memory)');
      await panel.getByLabel('Flame graph').click();

      await exploreProfilesPage.asserSelectedExplorationType('Flame graph');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/alloc_space');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
      });
    });

    test('Favorite action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('alloc_space (memory)');
      await panel.getByLabel('Favorite').click();

      await exploreProfilesPage.selectExplorationType('Favorites');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
    });
  });
});
