import { expect, test } from '../../fixtures';

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await expect(singleViewPage.getTitle()).toHaveText('Single view');
    await singleViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(singleViewPage.queryBuilder.get()).toBeVisible();
  });
});

test.describe('URL search parameters', () => {
  test('When no parameters are provided, it selects the correct service, profile type & time range', async ({
    singleViewPage,
    toolbar,
  }) => {
    await singleViewPage.goto('');

    await toolbar.assertNoSpinners();

    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
  });

  test('When only the "from" and "until" parameters are provided, it selects the correct service, profile type & time range', async ({
    singleViewPage,
    toolbar,
  }) => {
    await singleViewPage.goto(
      new URLSearchParams({
        from: '1710354600', // 20-24-03-13 19:30:00
        until: '1710355320', // 20-24-03-13 19:42:00
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
  });

  test('When only the "query" parameter is provided, it selects the correct service, profile type & time range', async ({
    singleViewPage,
    toolbar,
  }) => {
    await singleViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
  });

  test('When there is no data during the time range provided, it displays "No data" banners', async ({
    singleViewPage,
    toolbar,
  }) => {
    await singleViewPage.goto(
      new URLSearchParams({
        query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}',
        from: '1704063600', // 2024-01-01
        until: '1704150000', // 2024-01-02
      }).toString()
    );

    await toolbar.assertNoSpinners();

    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });
});

test.describe('Toolbar', () => {
  test.describe('Service selection', () => {
    test('Updates the toolbar and the panels data (pyroscope)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.selectService('pyroscope');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (load-generator)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.selectService('load-generator');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });
  });

  test.describe('Profile type selection', () => {
    test('Updates the toolbar and the panels data (go - inuse_space)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.selectProfileType('inuse_space (memory)');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });
  });
});

test.describe('Time picker', () => {
  test('Zooming out', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await toolbar.zoomOutTimeRange();

    await toolbar.assertNoSpinners();
    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });

  test('Moving backwards', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await toolbar.moveTimeRangeBackwards();

    await toolbar.assertNoSpinners();
    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });

  test('Moving forwards', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await toolbar.moveTimeRangeForwards();

    await toolbar.assertNoSpinners();
    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });
});

test.describe('Query builder', () => {
  test('Can add a single filter', async ({ singleViewPage, toolbar }) => {
    await singleViewPage.goto();

    await singleViewPage.queryBuilder.addFilter(['vehicle', '=', 'scooter']);
    await expect(singleViewPage.queryBuilder.get()).toHaveScreenshot();

    await singleViewPage.queryBuilder.clickOnExecute();
    await expect(singleViewPage.queryBuilder.get()).toHaveScreenshot();

    await toolbar.assertNoSpinners();
    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });
});
