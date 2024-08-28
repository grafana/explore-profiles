import { expect, test } from '../../fixtures';

test.describe('Onboarding', () => {
  test('displays an onboarding modal that can be closed', async ({ page }) => {
    await page.route('*/**/querier.v1.QuerierService/GetProfileStats', async (route) => {
      const json = {
        dataIngested: false,
        oldestProfileTime: 0,
        newestProfileTime: 0,
      };

      await route.fulfill({ json });
    });

    await page.goto('/a/grafana-pyroscope-app');

    const onboardingModal = page.getByTestId('onboarding-modal');

    await expect(onboardingModal).toBeVisible();
    await expect(onboardingModal.getByTestId('hero')).toHaveScreenshot();
    await expect(onboardingModal.getByTestId('what-you-can-do')).toHaveScreenshot();
    await expect(onboardingModal.getByTestId('how-to-get-started')).toHaveScreenshot();

    await page.getByTestId('close-onboarding-modal').click();

    await expect(onboardingModal).not.toBeVisible();
  });
});
