import { expect, test } from '../../fixtures';

test.describe('All services view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto();
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('All services');
    await exploreProfilesPage.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

    // body scene controls
    await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');
    await exploreProfilesPage.assertQuickFilterValue('');
    await exploreProfilesPage.assertSelectedLayout('Grid');

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
  });

  test('Profile type selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectProfileType('memory/inuse_objects');
    await exploreProfilesPage.assertSelectedProfileType('memory/inuse_objects');

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
  });

  test('Quick filter', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.enterQuickFilterText('sharing,load');

    await expect(exploreProfilesPage.getPanelByTitle('load-generator')).toBeVisible();
    await expect(exploreProfilesPage.getPanelByTitle('ride-sharing-app')).toBeVisible();
    await expect(exploreProfilesPage.getPanelByTitle('pyroscope')).not.toBeVisible();
  });

  test('Layout switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectLayout('Rows');

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
    });
  });

  test.describe('Panel actions', () => {
    test('Profile types action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app');
      await panel.getByLabel('Profile types').click();

      await exploreProfilesPage.asserSelectedExplorationType('Profile types');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
    });

    test('Labels action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app');
      await panel.getByLabel('Labels').click();

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
      });
    });

    test('Flame graph action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app');
      await panel.getByLabel('Flame graph').click();

      await exploreProfilesPage.asserSelectedExplorationType('Flame graph');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/tests/all-services-view/hide-all-controls.css',
      });
    });

    test('Favorite action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app');
      await panel.getByLabel('Favorite').click();

      await exploreProfilesPage.selectExplorationType('Favorites');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
    });
  });
});
