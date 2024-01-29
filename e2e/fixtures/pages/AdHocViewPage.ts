import { expect, type Page } from '@playwright/test';

import { PyroscopePage } from './PyroscopePage';

export class AdHocViewPage extends PyroscopePage {
  constructor(readonly page: Page) {
    super(page, '/a/grafana-pyroscope-app/ad-hoc', '');
  }

  selectTab(name: string) {
    return this.page.locator('.pyroscope-app').getByRole('tab', { name }).click();
  }

  getProfileTypeDropdown(index?: number) {
    const locator = this.page.getByTestId('profile-types-dropdown');

    return index !== undefined ? locator.nth(index) : locator;
  }

  async selectProfileType(label: string) {
    await this.getProfileTypeDropdown().locator('div').first().click();
    await this.page.getByText(label).click();
  }

  getFileDropZone(index?: number) {
    const locator = this.page.getByTestId('dropzone');

    return index !== undefined ? locator.nth(index) : locator;
  }

  async assertAcceptedFileTypes(fileTypesList: string, index?: number) {
    const locator = this.page.locator('.pyroscope-app').getByText(`Accepted file types: ${fileTypesList}`);
    const infoNote = index !== undefined ? locator.nth(index) : locator;

    await expect(infoNote).toBeVisible();
  }

  async dropFile(filePath: string, index?: number) {
    const locator = this.page.getByTestId('dropzone').locator('input[type="file"]');
    const input = index !== undefined ? locator.nth(index) : locator;

    await input.setInputFiles(filePath);
  }

  async assertSelectedProfileType(profileType: string, index?: number) {
    await expect(this.getProfileTypeDropdown(index).getByText(profileType)).toBeVisible();
  }

  getFlamegraph(index?: number) {
    const locator = this.page.getByTestId('flamegraph');

    return index !== undefined ? locator.nth(index) : locator;
  }

  getRemoveFileButton(index?: number) {
    const locator = this.page.getByLabel('Remove file');

    return index !== undefined ? locator.nth(index) : locator;
  }
}
