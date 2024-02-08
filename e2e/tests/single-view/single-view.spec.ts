import { expect, test } from '../../fixtures';
import { setupRequestListeners } from './api-snapshots/helpers/setupRequestListeners';
import { toMatchApiSnapshot } from './api-snapshots/helpers/toMatchApiSnapshot';

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

      await toolbar.assertNoSpinners();
      await singleViewPage.assertNoLoadingPanels();
      await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
      const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

      await toolbar.selectService('pyroscope-rideshare-java');

      await toMatchApiSnapshot('RENDER_TOOLBAR_SERVICE_JAVA', await renderRequestP, false);

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (ruby)', async ({ singleViewPage, toolbar }) => {
      await singleViewPage.goto();

      await toolbar.assertNoSpinners();
      await singleViewPage.assertNoLoadingPanels();
      await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
      const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

      await toolbar.selectService('pyroscope-rideshare-ruby');

      await toMatchApiSnapshot('RENDER_TOOLBAR_SERVICE_RUBY', await renderRequestP, false);

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

      await toolbar.assertNoSpinners();
      await singleViewPage.assertNoLoadingPanels();
      await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
      const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

      await toolbar.selectProfileType('inuse_space (memory)');

      await toMatchApiSnapshot('RENDER_TOOLBAR_PROFILE_GO_INUSE_SPACE', await renderRequestP, false);

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

    await toolbar.assertNoSpinners();
    await singleViewPage.assertNoLoadingPanels();
    await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
    const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

    await toolbar.zoomOutTimeRange();

    await toMatchApiSnapshot('RENDER_TOOLBAR_TIMEPICKER_ZOOMOUT', await renderRequestP, false);

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

    await toolbar.assertNoSpinners();
    await singleViewPage.assertNoLoadingPanels();
    await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
    const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

    await toolbar.moveTimeRangeBackwards();

    await toMatchApiSnapshot('RENDER_TOOLBAR_TIMEPICKER_BACKWARDS', await renderRequestP, false);

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

    await toolbar.assertNoSpinners();
    await singleViewPage.assertNoLoadingPanels();
    await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
    const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

    await toolbar.moveTimeRangeForwards();

    await toMatchApiSnapshot('RENDER_TOOLBAR_TIMEPICKER_FORWARDS', await renderRequestP, false);

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

    const [labelNamesRequestP, labelValuesRequestP] = setupRequestListeners(singleViewPage, [
      '**/querier.v1.QuerierService/LabelNames',
      '**/querier.v1.QuerierService/LabelValues',
    ]);

    await singleViewPage.queryBuilder.addFilter(['vehicle', '=', 'scooter']);
    await expect(singleViewPage.queryBuilder.get()).toHaveScreenshot();

    await toMatchApiSnapshot('LABEL_NAMES', await labelNamesRequestP);
    await toMatchApiSnapshot('LABEL_VALUES', await labelValuesRequestP);

    await toolbar.assertNoSpinners();
    await singleViewPage.assertNoLoadingPanels();
    await singleViewPage.waitForTimeout(2000); // TODO: remove after Pyroscope OSS migration is finished
    const [renderRequestP] = setupRequestListeners(singleViewPage, ['**/pyroscope/render*']);

    await singleViewPage.queryBuilder.clickOnExecute();
    await expect(singleViewPage.queryBuilder.get()).toHaveScreenshot();

    await toMatchApiSnapshot('RENDER_QUERY_BUILDER', await renderRequestP, false);

    await toolbar.assertNoSpinners();
    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();

    await singleViewPage.assertNoLoadingPanels();
    await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
    await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
  });
});
