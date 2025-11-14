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
    await exploreProfilesPage.assertQuickFilter('Search favorites (comma-separated regexes are supported)', '', 4);
    await exploreProfilesPage.assertSelectedLayout('Grid');
    await exploreProfilesPage.assertHideNoDataSwitcher(false);

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
  });

  test('Quick filter', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.assertQuickFilterResultsCount(4);

    await exploreProfilesPage.enterQuickFilterText('load,ride');

    await exploreProfilesPage.assertQuickFilterResultsCount(3);

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

  test('Hide no data switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectTimeRange('Last 5 minutes');

    await expect(exploreProfilesPage.getPanels()).toHaveCount(4);
    await expect(exploreProfilesPage.getPanelByTitle('pyroscope · goroutine (goroutine)')).toBeVisible();

    await exploreProfilesPage.assertPanelHasNoData('load-generator · cpu (process_cpu)');
    await exploreProfilesPage.assertPanelHasNoData('ride-sharing-app · inuse_space (memory)');
    await exploreProfilesPage.assertPanelHasNoData('ride-sharing-app · samples (process_cpu) · vehicle (4)');

    await exploreProfilesPage.selectHidePanelsWithoutNoData();

    await expect(exploreProfilesPage.getPanels()).toHaveCount(1);
    await expect(exploreProfilesPage.getPanelByTitle('pyroscope · goroutine (goroutine)')).toBeVisible();
  });

  test.describe('Panel actions', () => {
    test('Labels action without "group by"', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction('ride-sharing-app · inuse_space (memory)', 'Labels');

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/inuse_space');

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Labels action with "group by"', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction('ride-sharing-app · samples (process_cpu) · vehicle (4)', 'Labels');

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('process_cpu/samples');

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Flame graph action', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction('ride-sharing-app · inuse_space (memory)', 'Flame graph');

      await exploreProfilesPage.asserSelectedExplorationType('Flame graph');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('memory/inuse_space');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Expand panel action', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction(
        'ride-sharing-app · samples (process_cpu) · vehicle (4)',
        'Expand panel'
      );

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });
  });
});
