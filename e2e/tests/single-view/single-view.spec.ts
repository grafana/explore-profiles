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
        from: '1699688210000',
        until: '1699705810000',
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
});

test.describe('Toolbar', () => {
  test.describe('Service selection', () => {
    test('Updates the toolbar and the panels data (java)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.selectService('pyroscope-rideshare-java');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();

      await singleViewPage.waitForTimeout(2000); // TEMP
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (ruby)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.selectService('pyroscope-rideshare-ruby');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();

      await singleViewPage.waitForTimeout(2000); // TEMP
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

      await singleViewPage.waitForTimeout(2000); // TEMP
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

    await singleViewPage.waitForTimeout(2000); // TEMP
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

    await singleViewPage.waitForTimeout(2000); // TEMP
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

    await singleViewPage.waitForTimeout(2000); // TEMP
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

    await singleViewPage.waitForTimeout(2000); // TEMP
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });
});
