import { expect, test } from '../../fixtures';

test.describe.skip('Smoke tests', () => {
  test('Page title, toolbar, loading indicators, panels', async ({ comparisonDiffViewPage, toolbar }) => {
    await comparisonDiffViewPage.goto();

    await expect(comparisonDiffViewPage.getTitle()).toHaveText('Comparison diff view');
    await comparisonDiffViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(comparisonDiffViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonDiffViewPage.getComparisonPanel()).toContainText('Comparison time range');
    await expect(comparisonDiffViewPage.getDiffPanel()).toBeVisible();
  });
});

test.describe.skip('URL search parameters', () => {
  test('When no parameters are provided, it selects the correct service, profile type & time range', async ({
    comparisonDiffViewPage,
    toolbar,
  }) => {
    await comparisonDiffViewPage.goto('');

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('pyroscope');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('Last 30 minutes');
  });

  test('When only the "from" and "to" parameters are provided, it selects the correct service, profile type & time range', async ({
    comparisonDiffViewPage,
    toolbar,
  }) => {
    await comparisonDiffViewPage.goto(
      new URLSearchParams({
        from: '1710354600', // 2024-03-13 19:30:00
        to: '1710355320', // 2024-03-13 19:42:00
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('load-generator');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 19:30:00 to 2024-03-13 19:42:00');
  });

  test('When only the "query" parameter is provided, it selects the correct service, profile type & time range', async ({
    comparisonDiffViewPage,
    toolbar,
  }) => {
    await comparisonDiffViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('pyroscope');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('Last 30 minutes');
  });

  test('When there is no data during the time range provided, it displays "No data" banners', async ({
    comparisonDiffViewPage,
    toolbar,
  }) => {
    await comparisonDiffViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
        from: 'now-25m',
        to: 'now-24m',
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('');
    await toolbar.assertSelectedProfileType('Choose a profile type (0)');

    await comparisonDiffViewPage.assertNoLoadingPanels();

    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toContainText('No timeline data available');
    await expect(comparisonDiffViewPage.getBaselinePanel()).toContainText('No timeline data available');
    await expect(comparisonDiffViewPage.getComparisonPanel()).toContainText('No timeline data available');
    await expect(comparisonDiffViewPage.getDiffPanel()).toContainText('No profile data available');
  });
});

test.describe.skip('Time picker', () => {
  test('Zooming out', async ({ comparisonDiffViewPage, toolbar }) => {
    await comparisonDiffViewPage.goto();

    await toolbar.zoomOutTimeRange();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 18:35:00 to 2024-03-13 20:15:00');

    await comparisonDiffViewPage.assertNoLoadingPanels();
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });

  test('Moving backwards', async ({ comparisonDiffViewPage, toolbar }) => {
    await comparisonDiffViewPage.goto();

    await toolbar.moveTimeRangeBackwards();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 18:35:00 to 2024-03-13 19:25:00');

    await comparisonDiffViewPage.assertNoLoadingPanels();
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });

  test('Moving forwards', async ({ comparisonDiffViewPage, toolbar }) => {
    await comparisonDiffViewPage.goto();

    await toolbar.moveTimeRangeForwards();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 19:25:00 to 2024-03-13 20:15:00');

    await comparisonDiffViewPage.assertNoLoadingPanels();
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });
});

test.describe.skip('Toolbar', () => {
  test.describe('Service selection', () => {
    test('Updates the toolbar and the panels data (pyroscope)', async ({ comparisonDiffViewPage, toolbar }) => {
      await comparisonDiffViewPage.goto();

      await toolbar.selectService('pyroscope');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('pyroscope');
      await toolbar.assertSelectedProfileType('cpu (process_cpu)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonDiffViewPage.assertNoLoadingPanels();
      await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (load-generator)', async ({ comparisonDiffViewPage, toolbar }) => {
      await comparisonDiffViewPage.goto();

      await toolbar.selectService('load-generator');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('load-generator');
      await toolbar.assertSelectedProfileType('cpu (process_cpu)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonDiffViewPage.assertNoLoadingPanels();
      await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
    });
  });

  test.describe('Profile type selection', () => {
    test('Updates the toolbar and the panels data (go - inuse_space)', async ({ comparisonDiffViewPage, toolbar }) => {
      await comparisonDiffViewPage.goto();

      await toolbar.selectProfileType('inuse_space (memory)');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('ride-sharing-app');
      await toolbar.assertSelectedProfileType('inuse_space (memory)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonDiffViewPage.assertNoLoadingPanels();
      await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
      await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
    });
  });
});

test.describe.skip('Mouse selections of time ranges on the timelines', () => {
  test('Selecting on the main, baseline & comparison timelines', async ({ comparisonDiffViewPage, toolbar }) => {
    await comparisonDiffViewPage.goto();
    await comparisonDiffViewPage.assertNoLoadingPanels();

    // baseline timeline selection
    await comparisonDiffViewPage.baselineTimeline.clickAndDrag({ x: 150, y: 100 }, { x: 200, y: 100 });

    await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();

    // comparison timeline selection, drag in the reverse direction
    await comparisonDiffViewPage.comparisonTimeline.clickAndDrag({ x: 320, y: 100 }, { x: 240, y: 100 });

    await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();

    // main timeline selection
    await comparisonDiffViewPage.mainTimeline.clickAndDrag({ x: 100, y: 100 }, { x: 700, y: 100 });

    // we have to take a screenshot of the time picker because the resolutions on a local machine might be different from the resolution in the
    // Docker container, so CI executions might fail or vice versa
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });
});

test.describe.skip('Query builders', () => {
  test('Can add a single filter in the baseline panel', async ({ comparisonDiffViewPage }) => {
    await comparisonDiffViewPage.goto();
    await comparisonDiffViewPage.assertNoLoadingPanels();

    await comparisonDiffViewPage.baselineQueryBuilder.addFilter(['vehicle', '=', 'car']);
    await comparisonDiffViewPage.baselineQueryBuilder.clickOnExecute();

    await comparisonDiffViewPage.assertNoLoadingPanels();

    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });

  test('Can add a single filter in the comparison panel', async ({ comparisonDiffViewPage }) => {
    await comparisonDiffViewPage.goto();
    await comparisonDiffViewPage.assertNoLoadingPanels();

    await comparisonDiffViewPage.comparisonQueryBuilder.addFilter(['vehicle', '!=', 'scooter']);
    await comparisonDiffViewPage.comparisonQueryBuilder.clickOnExecute();

    await comparisonDiffViewPage.assertNoLoadingPanels();

    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });

  test('Can add a single filter in both the baseline & comparison panels', async ({ comparisonDiffViewPage }) => {
    await comparisonDiffViewPage.goto();
    await comparisonDiffViewPage.assertNoLoadingPanels();

    await comparisonDiffViewPage.baselineQueryBuilder.addFilter(['region', '=', 'ap-south']);
    await comparisonDiffViewPage.baselineQueryBuilder.clickOnExecute();

    await comparisonDiffViewPage.comparisonQueryBuilder.addFilter(['region', '=', 'eu-north']);
    await comparisonDiffViewPage.comparisonQueryBuilder.clickOnExecute();

    await comparisonDiffViewPage.assertNoLoadingPanels();

    await expect(comparisonDiffViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getComparisonPanel()).toHaveScreenshot();
    await expect(comparisonDiffViewPage.getDiffPanel()).toHaveScreenshot();
  });
});
