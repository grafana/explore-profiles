import { ExplorationType, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('Diff flame graph view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('Diff flame graph');

    // body scene controls
    await exploreProfilesPage.assertSelectedService('ride-sharing-app');
    await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');

    // panels
    const expectedTimeRange = '2024-03-13 19:00:00 to 2024-03-13 19:50:00';

    await expect(exploreProfilesPage.getComparisonTimePickerButton('baseline')).toContainText(expectedTimeRange);
    await exploreProfilesPage.assertFilters([], 'filtersBaseline');

    await expect(exploreProfilesPage.getComparisonTimePickerButton('comparison')).toContainText(expectedTimeRange);
    await exploreProfilesPage.assertFilters([], 'filtersComparison');

    // diff flame graph panel
    const diffFlameGraphPanel = exploreProfilesPage.getByTestId('diff-flame-graph-panel');
    await expect(diffFlameGraphPanel.locator('h6')).toContainText('Diff flame graph for ride-sharing-app (cpu)');
    await expect(diffFlameGraphPanel.getByRole('button', { name: /Explain Flame Graph/i })).toBeVisible();

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Service selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectService('pyroscope');

    await exploreProfilesPage.assertSelectedService('pyroscope');
    await exploreProfilesPage.mouse.move(0, 0); // prevents the time picker tooltip to appear on the screenshot

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Profile type selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectProfileType('memory/alloc_space');

    await exploreProfilesPage.assertSelectedProfileType('memory/alloc_space');

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
    const baselineFilter = ['vehicle', '=', 'scooter'];
    const comparisonFilter = ['vehicle', '!=', 'scooter'];

    test.beforeEach(async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.addFilter(baselineFilter, 'filtersBaseline');
      await exploreProfilesPage.assertFilters([baselineFilter], 'filtersBaseline');

      await exploreProfilesPage.addFilter(comparisonFilter, 'filtersComparison');
      await exploreProfilesPage.assertFilters([comparisonFilter], 'filtersComparison');
    });

    test('Adding a filter', async ({ exploreProfilesPage }) => {
      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Filters are persisted when changing the profile type', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectProfileType('memory/alloc_space');

      await exploreProfilesPage.assertFilters([baselineFilter], 'filtersBaseline');
      await exploreProfilesPage.assertFilters([comparisonFilter], 'filtersComparison');
    });

    test('Filters are cleared when changing the service', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectService('pyroscope');

      await exploreProfilesPage.assertFilters([], 'filtersBaseline');
      await exploreProfilesPage.assertFilters([], 'filtersComparison');
    });
  });
});
