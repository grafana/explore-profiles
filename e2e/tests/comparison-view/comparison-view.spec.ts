import { expect, test } from '../../fixtures';

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators, panels', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();

    await expect(comparisonViewPage.getTitle()).toHaveText('Comparison view');
    await comparisonViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(comparisonViewPage.getBaselinePanel()).toContainText('Baseline time range');
    await expect(comparisonViewPage.getComparisonPanel()).toContainText('Comparison time range');
  });
});

test.describe('URL search parameters', () => {
  test('When no parameters are provided, it selects the correct service, profile type & time range', async ({
    comparisonViewPage,
    toolbar,
  }) => {
    await comparisonViewPage.goto('');

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('pyroscope');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('Last 1 hour');
  });

  test('When only the "from" and "to" parameters are provided, it selects the correct service, profile type & time range', async ({
    comparisonViewPage,
    toolbar,
  }) => {
    await comparisonViewPage.goto(
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
    comparisonViewPage,
    toolbar,
  }) => {
    await comparisonViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('pyroscope');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('Last 1 hour');
  });

  test('When there is no data during the time range provided, it displays "No data" banners', async ({
    comparisonViewPage,
    toolbar,
  }) => {
    await comparisonViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
        from: 'now-25m',
        to: 'now-24m',
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await toolbar.assertSelectedService('');
    await toolbar.assertSelectedProfileType('Choose a profile type (0)');

    await comparisonViewPage.assertNoLoadingPanels();

    await expect(comparisonViewPage.getMainTimelinePanel()).toContainText('No timeline data available');

    const baselinePanel = comparisonViewPage.getBaselinePanel();
    await expect(baselinePanel).toContainText('No timeline data available');
    await expect(baselinePanel).toContainText('No profile data available');

    const comparisonPanel = comparisonViewPage.getComparisonPanel();
    await expect(comparisonPanel).toContainText('No timeline data available');
    await expect(comparisonPanel).toContainText('No profile data available');
  });
});

test.describe('Time picker', () => {
  test('Zooming out', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();

    await toolbar.zoomOutTimeRange();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 18:35:00 to 2024-03-13 20:15:00');

    await comparisonViewPage.assertNoLoadingPanels();
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });

  test('Moving backwards', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();

    await toolbar.moveTimeRangeBackwards();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 18:35:00 to 2024-03-13 19:25:00');

    await comparisonViewPage.assertNoLoadingPanels();
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });

  test('Moving forwards', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();

    await toolbar.moveTimeRangeForwards();

    await toolbar.assertNoSpinners();
    await toolbar.assertSelectedService('ride-sharing-app');
    await toolbar.assertSelectedProfileType('cpu (process_cpu)');
    await toolbar.assertSelectedTimeRange('2024-03-13 19:25:00 to 2024-03-13 20:15:00');

    await comparisonViewPage.assertNoLoadingPanels();
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });
});

test.describe('Toolbar', () => {
  test.describe('Service selection', () => {
    test('Updates the toolbar and the panels data (pyroscope)', async ({ comparisonViewPage, toolbar }) => {
      await comparisonViewPage.goto();

      await toolbar.selectService('pyroscope');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('pyroscope');
      await toolbar.assertSelectedProfileType('cpu (process_cpu)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonViewPage.assertNoLoadingPanels();
      await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (load-generator)', async ({ comparisonViewPage, toolbar }) => {
      await comparisonViewPage.goto();

      await toolbar.selectService('load-generator');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('load-generator');
      await toolbar.assertSelectedProfileType('cpu (process_cpu)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonViewPage.assertNoLoadingPanels();
      await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
    });
  });

  test.describe('Profile type selection', () => {
    test('Updates the toolbar and the panels data (go - inuse_space)', async ({ comparisonViewPage, toolbar }) => {
      await comparisonViewPage.goto();

      await toolbar.selectProfileType('inuse_space (memory)');

      await toolbar.assertNoSpinners();
      await toolbar.assertSelectedService('ride-sharing-app');
      await toolbar.assertSelectedProfileType('inuse_space (memory)');
      await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');

      await comparisonViewPage.assertNoLoadingPanels();
      await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
      await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
    });
  });
});

test.describe('Mouse selections of time ranges on the timelines', () => {
  test('Selecting on the main, baseline & comparison timelines', async ({ comparisonViewPage, toolbar }) => {
    await comparisonViewPage.goto();
    await comparisonViewPage.assertNoLoadingPanels();

    // baseline timeline selection
    await comparisonViewPage.baselineTimeline.clickAndDrag({ x: 150, y: 100 }, { x: 200, y: 100 });

    await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();

    // comparison timeline selection, drag in the reverse direction
    await comparisonViewPage.comparisonTimeline.clickAndDrag({ x: 320, y: 100 }, { x: 240, y: 100 });

    await toolbar.assertSelectedTimeRange('2024-03-13 19:00:00 to 2024-03-13 19:50:00');
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();

    // main timeline selection
    await comparisonViewPage.mainTimeline.clickAndDrag({ x: 100, y: 100 }, { x: 700, y: 100 });

    // we have to take a screenshot of the time picker because the resolutions on a local machine might be different from the resolution in the
    // Docker container, so CI executions might fail or vice versa
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });
});

test.describe('Query builders', () => {
  test('Can add a single filter in the baseline panel', async ({ comparisonViewPage }) => {
    await comparisonViewPage.goto();
    await comparisonViewPage.assertNoLoadingPanels();

    await comparisonViewPage.baselineQueryBuilder.addFilter(['vehicle', '=', 'car']);
    await comparisonViewPage.baselineQueryBuilder.clickOnExecute();

    await comparisonViewPage.assertNoLoadingPanels();

    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });

  test('Can add a single filter in the comparison panel', async ({ comparisonViewPage }) => {
    await comparisonViewPage.goto();
    await comparisonViewPage.assertNoLoadingPanels();

    await comparisonViewPage.comparisonQueryBuilder.addFilter(['vehicle', '!=', 'scooter']);
    await comparisonViewPage.comparisonQueryBuilder.clickOnExecute();

    await comparisonViewPage.assertNoLoadingPanels();

    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });

  test('Can add a single filter in both the baseline & comparison panels', async ({ comparisonViewPage }) => {
    await comparisonViewPage.goto();
    await comparisonViewPage.assertNoLoadingPanels();

    await comparisonViewPage.baselineQueryBuilder.addFilter(['region', '=', 'ap-south']);
    await comparisonViewPage.baselineQueryBuilder.clickOnExecute();

    await comparisonViewPage.comparisonQueryBuilder.addFilter(['region', '=', 'eu-north']);
    await comparisonViewPage.comparisonQueryBuilder.clickOnExecute();

    await comparisonViewPage.assertNoLoadingPanels();

    await expect(comparisonViewPage.getMainTimelinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getBaselinePanel()).toHaveScreenshot();
    await expect(comparisonViewPage.getComparisonPanel()).toHaveScreenshot();
  });
});
