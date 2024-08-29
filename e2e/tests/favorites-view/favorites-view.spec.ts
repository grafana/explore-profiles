import { ExplorationType } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('Favorites view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.AllServices);

    await exploreProfilesPage.clickOnPanelAction('load-generator', 'Favorite');

    await exploreProfilesPage.selectProfileType('goroutine/goroutine');
    await exploreProfilesPage.clickOnPanelAction('pyroscope', 'Favorite');

    await exploreProfilesPage.selectProfileType('memory/inuse_space');
    await exploreProfilesPage.clickOnPanelAction('ride-sharing-app', 'Favorite');

    await exploreProfilesPage.selectProfileType('process_cpu/samples');
    await exploreProfilesPage.clickOnPanelAction('ride-sharing-app', 'Labels');
    await exploreProfilesPage.assertNoSpinner();
    await exploreProfilesPage.enterQuickFilterText('vehicle');
    await exploreProfilesPage.clickOnPanelAction('vehicle (4)', 'Favorite');

    await exploreProfilesPage.goto(ExplorationType.Favorites);
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('Favorites');
    await exploreProfilesPage.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

    // body scene controls
    await exploreProfilesPage.assertQuickFilter('Search favorites (comma-separated regexes are supported)', '');
    await exploreProfilesPage.assertSelectedLayout('Grid');
    await exploreProfilesPage.assertNoDataSwitcher(false);

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
  });

  test('Quick filter', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.enterQuickFilterText('load,ride');

    await expect(exploreProfilesPage.getPanels()).toHaveCount(3);
    await expect(exploreProfilesPage.getPanelByTitle('load-generator · cpu (process_cpu)')).toBeVisible();
    await expect(exploreProfilesPage.getPanelByTitle('ride-sharing-app · inuse_space (memory)')).toBeVisible();
    await expect(
      exploreProfilesPage.getPanelByTitle('ride-sharing-app · samples (process_cpu) · vehicle (4)')
    ).toBeVisible();
  });

  test('Layout switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectLayout('Rows');

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test.describe('Panel actions', () => {
    test('Labels action without "group by"', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app · inuse_space (memory)');
      await panel.getByLabel('Labels').click();

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/inuse_space');

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Labels action with "group by"', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app · samples (process_cpu) · vehicle (4)');
      await panel.getByLabel('Labels').click();

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('process_cpu/samples');

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Flame graph action', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app · inuse_space (memory)');
      await panel.getByLabel('Flame graph').click();

      await exploreProfilesPage.asserSelectedExplorationType('Flame graph');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/inuse_space');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    // test('Expand action', async ({ exploreProfilesPage }) => {
    //   const panel = await exploreProfilesPage.getPanelByTitle('alloc_space (memory)');
    //   await panel.getByLabel('Favorite').click();

    //   await exploreProfilesPage.selectExplorationType('Favorites');

    //   await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
    // });

    test('Favorite action, after clicking on the main refresh button', async ({ exploreProfilesPage }) => {
      const panel = await exploreProfilesPage.getPanelByTitle('ride-sharing-app · inuse_space (memory)');
      await panel.getByLabel('Favorite').click();

      await exploreProfilesPage.clickOnRefresh();

      await expect(exploreProfilesPage.getPanels()).toHaveCount(3);
      await expect(exploreProfilesPage.getPanelByTitle('load-generator · cpu (process_cpu)')).toBeVisible();
      await expect(exploreProfilesPage.getPanelByTitle('pyroscope · goroutine (goroutine)')).toBeVisible();
      await expect(
        exploreProfilesPage.getPanelByTitle('ride-sharing-app · samples (process_cpu) · vehicle (4)')
      ).toBeVisible();
    });
  });
});
