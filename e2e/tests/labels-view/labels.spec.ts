import { ExplorationType } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('Labels view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.Labels);
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('Labels');
    await exploreProfilesPage.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

    // body scene controls
    await exploreProfilesPage.assertSelectedService('ride-sharing-app');
    await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');
    await exploreProfilesPage.assertFilters([]);
    await exploreProfilesPage.assertQuickFilter('Search labels (comma-separated regexes are supported)', '');
    await exploreProfilesPage.assertSelectedPanelType('Time series');
    await exploreProfilesPage.assertSelectedLayout('Grid');
    await exploreProfilesPage.assertHideNoDataSwitcher(false);

    // body
    await exploreProfilesPage.assertNoSpinner();

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Service selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectService('pyroscope');

    await exploreProfilesPage.assertSelectedService('pyroscope');
    await exploreProfilesPage.assertNoSpinner();

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Profile type selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectProfileType('memory/alloc_space');

    await exploreProfilesPage.assertSelectedProfileType('memory/alloc_space');
    await exploreProfilesPage.assertNoSpinner();

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Dependency between the service selected and the profile type selector options', async ({
    exploreProfilesPage,
  }) => {
    await exploreProfilesPage.assertProfileTypeSelectorOptions(
      ['process_cpu', 'memory'],
      [
        ['cpu', 'samples'],
        ['alloc_objects', 'alloc_space', 'inuse_objects', 'inuse_space'],
      ]
    );

    await exploreProfilesPage.selectService('pyroscope');

    await exploreProfilesPage.assertProfileTypeSelectorOptions(
      ['process_cpu', 'mutex', 'memory', 'goroutine', 'block'],
      [
        ['cpu', 'samples'],
        ['contentions', 'delay'],
        ['alloc_objects', 'alloc_space', 'inuse_objects', 'inuse_space'],
        ['goroutine'],
        ['contentions', 'delay'],
      ]
    );
  });

  test.describe('Filters', () => {
    test('Adding a filter', async ({ exploreProfilesPage }) => {
      const filter = ['region', '=', 'eu-north'];
      await exploreProfilesPage.addFilter(filter);
      await exploreProfilesPage.assertFilters([filter]);

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Filters are persisted when changing the profile type', async ({ exploreProfilesPage }) => {
      const filter = ['vehicle', '=', 'bike'];
      await exploreProfilesPage.addFilter(filter);

      await exploreProfilesPage.selectProfileType('memory/alloc_space');

      await exploreProfilesPage.assertFilters([filter]);
    });

    test('Filters are cleared when changing the service', async ({ exploreProfilesPage }) => {
      const filter = ['vehicle', '=', 'car'];
      await exploreProfilesPage.addFilter(filter);

      await exploreProfilesPage.selectService('pyroscope');

      await exploreProfilesPage.assertFilters([]);
    });
  });

  test.describe.skip('Label selector', () => {
    test('Selects a label and displays the breakdown in a new grid', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectLabel('region');

      await exploreProfilesPage.assertNoSpinner();

      await expect(exploreProfilesPage.getGroupByContainer()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });
  });

  test('Quick filter', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.enterQuickFilterText('region,vehicle');

    await expect(exploreProfilesPage.getGroupByPanels()).toHaveCount(2);
    await expect(exploreProfilesPage.getPanelByTitle('region (3)')).toBeVisible();
    await expect(exploreProfilesPage.getPanelByTitle('vehicle (4)')).toBeVisible();
  });

  test('Panel type switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.assertNoSpinner();

    for (const panelType of ['Totals', 'Histograms']) {
      await exploreProfilesPage.selectPanelType(panelType);

      await expect(exploreProfilesPage.getGroupByContainer()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    }
  });

  test('Layout switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.assertNoSpinner();

    await exploreProfilesPage.selectLayout('Rows');

    await expect(exploreProfilesPage.getGroupByContainer()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Hide no data switcher', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.enterQuickFilterText('region,vehicle');
    await exploreProfilesPage.addFilter(['pyroscope_spy', '!=', 'gospy']);

    await expect(exploreProfilesPage.getGroupByPanels()).toHaveCount(2);
    await exploreProfilesPage.assertPanelHasNoData('region (3)');
    await exploreProfilesPage.assertPanelHasNoData('vehicle (4)');

    await exploreProfilesPage.selectHidePanelsWithoutNoData();

    await expect(exploreProfilesPage.getGroupByPanels()).toHaveCount(0);
    await expect(exploreProfilesPage.getGroupByContainer().getByText('No results')).toBeVisible();
  });
});
