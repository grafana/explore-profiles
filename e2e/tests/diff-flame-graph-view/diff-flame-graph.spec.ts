import { ExplorationType, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';
import { ExploreProfilesPage } from '../../fixtures/pages/ExploreProfilesPage';

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
    await expect(diffFlameGraphPanel.getByRole('button', { name: /Explain Diff Flame Graph/i })).toBeVisible();

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

  test.describe('Baseline panel', () => {
    test('Baseline time picker', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectService('pyroscope'); // clears the flame graph ranges

      await exploreProfilesPage.selectComparisonTimeRange('baseline', '2024-03-13 19:21', '2024-03-13 19:34');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Baseline time picker selection mode', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectService('pyroscope'); // clears the flame graph ranges

      await exploreProfilesPage.switchComparisonSelectionMode('baseline', 'Time picker');

      await exploreProfilesPage.clickAndDragOnComparisonPanel('baseline', { x: 200, y: 200 }, { x: 360, y: 200 });

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Baseline flame graph selection mode', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.switchComparisonSelectionMode('baseline', 'Flame graph');

      await exploreProfilesPage.clickAndDragOnComparisonPanel('baseline', { x: 200, y: 200 }, { x: 360, y: 200 });

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });
  });

  test.describe('Comparison panel', () => {
    test('Comparison time picker', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectService('pyroscope'); // clears the flame graph ranges

      await exploreProfilesPage.selectComparisonTimeRange('comparison', '2024-03-13 19:37', '2024-03-13 19:41');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Comparison time picker selection mode', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.selectService('pyroscope'); // clears the flame graph ranges

      await exploreProfilesPage.switchComparisonSelectionMode('comparison', 'Time picker');

      await exploreProfilesPage.clickAndDragOnComparisonPanel('comparison', { x: 470, y: 200 }, { x: 510, y: 200 });

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Comparison flame graph selection mode', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.switchComparisonSelectionMode('comparison', 'Flame graph');

      await exploreProfilesPage.clickAndDragOnComparisonPanel('comparison', { x: 470, y: 200 }, { x: 510, y: 200 });

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });
  });

  test.describe('Sync time ranges', () => {
    async function waitForApiResponses(exploreProfilesPage: ExploreProfilesPage) {
      let queriesCount = 0;

      return exploreProfilesPage.waitForResponse((response) => {
        const url = response.url();

        if (
          url.includes('/proxy/uid/grafanacloud-profiles-local-a/pyroscope/render-diff') ||
          url.includes('/api/ds/query?ds_type=grafana-pyroscope-datasource')
        ) {
          queriesCount += 1;
        }

        return queriesCount >= 3;
      });
    }

    test('Toggling', async ({ exploreProfilesPage }) => {
      const baselinePanel = exploreProfilesPage.getComparisonPanel('baseline');
      const comparisonPanel = exploreProfilesPage.getComparisonPanel('comparison');

      await baselinePanel.getByRole('button', { name: /^sync time ranges/i }).click();

      expect(baselinePanel.getByRole('button', { name: /^unsync time ranges/i })).toBeInViewport();
      expect(comparisonPanel.getByRole('button', { name: /^unsync time ranges/i })).toBeInViewport();

      await comparisonPanel.getByRole('button', { name: /sync time ranges/i }).click();

      expect(baselinePanel.getByRole('button', { name: /^sync time ranges/i })).toBeInViewport();
      expect(comparisonPanel.getByRole('button', { name: /^sync time ranges/i })).toBeInViewport();
    });

    test('Syncing flame graph range selection', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnSyncTimerangesButton('baseline');

      await Promise.all([
        exploreProfilesPage.clickAndDragOnComparisonPanel('comparison', { x: 470, y: 200 }, { x: 510, y: 200 }),
        waitForApiResponses(exploreProfilesPage),
      ]);

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Syncing time picker range selection', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnSyncTimerangesButton('comparison');
      await exploreProfilesPage.switchComparisonSelectionMode('baseline', 'Time picker');

      await Promise.all([
        exploreProfilesPage.clickAndDragOnComparisonPanel('baseline', { x: 470, y: 200 }, { x: 510, y: 200 }),
        waitForApiResponses(exploreProfilesPage),
      ]);

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });
  });
});
