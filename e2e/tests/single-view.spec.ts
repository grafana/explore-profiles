import { expect, test } from '../fixtures';

test.beforeEach(async ({ singleViewPage }) => {
  await singleViewPage.goto();
});

// TODO: when panel is loading (e.g. timeline panel), we have:
// <div aria-label="Panel loading bar" class="css-132bufy"></div>

test.describe('Smoke tests', () => {
  test('Page title, toolbar, loading indicators', async ({ singleViewPage, toolbar }) => {
    await expect(singleViewPage.getTitle()).toHaveText('Single view');
    await singleViewPage.assertNoLoadingPanels();

    await toolbar.assertVisible();
    await toolbar.assertNoSpinners();

    await expect(singleViewPage.queryBuilder.get()).toBeVisible();
  });
});

test.describe('Single view toolbar', () => {
  test('By default, selects the correct service (go), profile type (cpu) & time range', async ({ toolbar }) => {
    await toolbar.assertNoSpinners();

    await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
    await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
    await expect(toolbar.getTimePicker()).toHaveScreenshot();
  });

  test.describe('Service selection', () => {
    test('Updates the toolbar and the panels data (java)', async ({ singleViewPage, toolbar }) => {
      await toolbar.selectService('pyroscope-rideshare-java');

      await toolbar.assertNoSpinners();
      await expect(toolbar.getServicesDropdown()).toHaveScreenshot();
      await expect(toolbar.getProfileTypesDropdown()).toHaveScreenshot();
      await expect(toolbar.getTimePicker()).toHaveScreenshot();

      await singleViewPage.assertNoLoadingPanels();
      await expect(singleViewPage.getTimelinePanel()).toHaveScreenshot();
      await expect(singleViewPage.getFlamegraphPanel()).toHaveScreenshot();
    });

    test('Updates the toolbar and the panels data (ruby)', async ({ singleViewPage, toolbar }) => {
      await toolbar.selectService('pyroscope-rideshare-ruby');

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

test.describe('Query builder', () => {
  test('Can add a single filter', async ({ singleViewPage, toolbar }) => {
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
