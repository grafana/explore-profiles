import { expect, test } from '../../fixtures';

test.describe('Flame graph view', () => {
  test.beforeEach(async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto('flame-graph');
  });

  test('Main UI elements', async ({ exploreProfilesPage }) => {
    // app controls
    await exploreProfilesPage.assertSelectedDataSource('Local Pyroscope A');
    await exploreProfilesPage.asserSelectedExplorationType('Flame graph');
    await exploreProfilesPage.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

    // body scene controls
    await exploreProfilesPage.assertSelectedService('ride-sharing-app');
    await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');
    await exploreProfilesPage.assertFilters([]);

    // body
    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test('Service selector', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.selectService('pyroscope');

    await exploreProfilesPage.assertSelectedService('pyroscope');

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

  test('Filters', async ({ exploreProfilesPage }) => {
    const filter = ['vehicle', '=', 'scooter'];
    await exploreProfilesPage.addFilter(filter);
    await exploreProfilesPage.assertFilters([filter]);

    await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
      stylePath: './e2e/fixtures/css/hide-all-controls.css',
    });
  });

  test.describe('Panel actions', () => {
    test('Labels action', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction('Total nanoseconds of CPU time consumed', 'Labels');

      await exploreProfilesPage.asserSelectedExplorationType('Labels');
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');
      await exploreProfilesPage.assertSelectedProfileType('process_cpu/cpu');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot({
        stylePath: './e2e/fixtures/css/hide-all-controls.css',
      });
    });

    test('Favorite action', async ({ exploreProfilesPage }) => {
      await exploreProfilesPage.clickOnPanelAction('Total nanoseconds of CPU time consumed', 'Favorite');

      await exploreProfilesPage.selectExplorationType('Favorites');

      await expect(exploreProfilesPage.getSceneBody()).toHaveScreenshot();
    });
  });
});
