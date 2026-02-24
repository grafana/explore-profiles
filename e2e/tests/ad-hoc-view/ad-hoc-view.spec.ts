import path from 'path';

import { expect, test } from '../../fixtures';

test.beforeEach(async ({ adHocViewPage }) => {
  await adHocViewPage.goto();
});

test.describe('Smoke tests', () => {
  test('Page title & tabs', async ({ adHocViewPage }) => {
    await expect(adHocViewPage.getTitle()).toHaveText('Ad hoc view');

    // tabs
    const acceptedFileTypesList = '.gz, .json, .pb, .pprof';

    await adHocViewPage.selectTab('Single view');

    await expect(adHocViewPage.getProfileTypeDropdown()).toBeVisible();

    await expect(adHocViewPage.getFileDropZone()).toBeVisible();
    await adHocViewPage.assertAcceptedFileTypes(acceptedFileTypesList);

    await adHocViewPage.selectTab('Diff view');

    await expect(adHocViewPage.getProfileTypeDropdown(0)).toBeVisible();
    await expect(adHocViewPage.getFileDropZone(0)).toBeVisible();
    await adHocViewPage.assertAcceptedFileTypes(acceptedFileTypesList, 0);

    await expect(adHocViewPage.getProfileTypeDropdown(1)).toBeVisible();
    await expect(adHocViewPage.getFileDropZone(1)).toBeVisible();
    await adHocViewPage.assertAcceptedFileTypes(acceptedFileTypesList, 1);

    // mode toggle
    await expect(adHocViewPage.getModeToggle('Side by side')).toBeVisible();
    await expect(adHocViewPage.getModeToggle('Diff flamegraph')).toBeVisible();
  });
});

test.describe('Single view uploads', () => {
  test.describe('Single profile type', () => {
    test('Pprof uploads', async ({ adHocViewPage }) => {
      await adHocViewPage.selectTab('Single view');

      // 1st file upload
      let filePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb');
      await adHocViewPage.dropFile(filePath);

      await adHocViewPage.assertSelectedProfileType('cpu');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // 2nd file upload
      filePath = path.join(__dirname, 'profile-files', 'go-alloc_space-memory-5m.pb');
      await adHocViewPage.dropFile(filePath);

      await adHocViewPage.assertSelectedProfileType('alloc_space');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // remove uploaded file
      await adHocViewPage.getRemoveFileButton().click();
      await expect(adHocViewPage.getFlamegraph()).not.toBeVisible();
      await adHocViewPage.assertSelectedProfileType('Choose');
    });

    test('Gzipped Pprof uploads', async ({ adHocViewPage }) => {
      await adHocViewPage.selectTab('Single view');

      // 1st file upload
      let filePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb.gz');
      await adHocViewPage.dropFile(filePath);

      await adHocViewPage.assertSelectedProfileType('cpu');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // 2nd file upload
      filePath = path.join(__dirname, 'profile-files', 'go-alloc_space-memory-5m.pb.gz');
      await adHocViewPage.dropFile(filePath);

      await adHocViewPage.assertSelectedProfileType('alloc_space');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // remove uploaded file
      await adHocViewPage.getRemoveFileButton().click();
      await expect(adHocViewPage.getFlamegraph()).not.toBeVisible();
      await adHocViewPage.assertSelectedProfileType('Choose');
    });
  });

  test.describe('Multiple profile types', () => {
    test('Pprof uploads', async ({ adHocViewPage }) => {
      await adHocViewPage.selectTab('Single view');

      const filePath = path.join(
        __dirname,
        'profile-files',
        'prometheus.alloc_objects.alloc_space.inuse_objects.inuse_space.pb'
      );
      await adHocViewPage.dropFile(filePath);

      await adHocViewPage.assertSelectedProfileType('alloc_objects');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // 1st selection
      await adHocViewPage.selectProfileType('inuse_space');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();

      // 2nd selection
      await adHocViewPage.selectProfileType('inuse_objects');
      await expect(adHocViewPage.getFlamegraph()).toHaveScreenshot();
    });
  });
});

test.describe('Diff view uploads', () => {
  test('Side by side uploads', async ({ adHocViewPage }) => {
    await adHocViewPage.selectTab('Diff view');

    // upload left file
    const leftFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb');
    await adHocViewPage.dropFile(leftFilePath, 0);

    await adHocViewPage.assertSelectedProfileType('cpu', 0);
    await expect(adHocViewPage.getFlamegraph(0)).toBeVisible();

    // upload right file (same profile type to ensure intersection is non-empty)
    const rightFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb.gz');
    await adHocViewPage.dropFile(rightFilePath, 1);

    await adHocViewPage.assertSelectedProfileType('cpu', 1);
    await expect(adHocViewPage.getFlamegraph(0)).toBeVisible();
    await expect(adHocViewPage.getFlamegraph(1)).toBeVisible();
  });

  test('File removal clears flamegraph', async ({ adHocViewPage }) => {
    await adHocViewPage.selectTab('Diff view');

    // upload both files
    const leftFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb');
    await adHocViewPage.dropFile(leftFilePath, 0);
    await expect(adHocViewPage.getFlamegraph(0)).toBeVisible();

    const rightFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb.gz');
    await adHocViewPage.dropFile(rightFilePath, 1);
    await expect(adHocViewPage.getFlamegraph(1)).toBeVisible();

    // remove left file
    await adHocViewPage.getRemoveFileButton(0).click();
    await expect(adHocViewPage.getFlamegraph()).toHaveCount(1);

    // remove right file
    await adHocViewPage.getRemoveFileButton(0).click();
    await expect(adHocViewPage.getFlamegraph()).toHaveCount(0);
  });

  test('Mode toggle', async ({ adHocViewPage }) => {
    await adHocViewPage.selectTab('Diff view');

    // upload both files in side-by-side mode
    const leftFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb');
    await adHocViewPage.dropFile(leftFilePath, 0);

    const rightFilePath = path.join(__dirname, 'profile-files', 'dotnet-cpu-process_cpu-5m.pb.gz');
    await adHocViewPage.dropFile(rightFilePath, 1);

    await expect(adHocViewPage.getFlamegraph(0)).toBeVisible();
    await expect(adHocViewPage.getFlamegraph(1)).toBeVisible();

    // switch to diff flamegraph mode — side-by-side flamegraphs should disappear
    await adHocViewPage.selectMode('Diff flamegraph');
    await expect(adHocViewPage.getFlamegraph()).toHaveCount(0);

    // switch back to side-by-side — both flamegraphs should reappear
    await adHocViewPage.selectMode('Side by side');
    await expect(adHocViewPage.getFlamegraph(0)).toBeVisible();
    await expect(adHocViewPage.getFlamegraph(1)).toBeVisible();
  });
});
