import { ExplorationType, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';

function parseTimeRange(text: string): { from: Date; to: Date } {
  const match = text.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) to (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  if (!match) {
    throw new Error(`Could not parse time range from: "${text}"`);
  }
  return { from: new Date(match[1]), to: new Date(match[2]) };
}

test.describe('Keyboard shortcuts', () => {
  test.describe('Time picker shortcuts', () => {
    test('"t a" converts relative time range to absolute', async ({ exploreProfilesPage, page }) => {
      // Navigate with a relative time range
      await exploreProfilesPage.goto(ExplorationType.FlameGraph, new URLSearchParams({ from: 'now-1h', to: 'now' }));

      await exploreProfilesPage.assertSelectedTimeRange(/Last 1 hour/);

      // Press "t a" to convert to absolute
      await page.keyboard.press('t');
      await page.keyboard.press('a');

      // The time range should now be shown as absolute dates (not "Last 1 hour")
      await expect(exploreProfilesPage.getTimePickerButton()).not.toContainText('Last 1 hour');
      await exploreProfilesPage.assertSelectedTimeRange(
        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} to \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
      );
    });

    test('"t z" zooms out the time range', async ({ exploreProfilesPage, page }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      const originalText = await exploreProfilesPage.getTimePickerButton().textContent();
      const original = parseTimeRange(originalText!);

      // Press "t z" to zoom out
      await page.keyboard.press('t');
      await page.keyboard.press('z');

      await expect(async () => {
        const newText = await exploreProfilesPage.getTimePickerButton().textContent();
        const updated = parseTimeRange(newText!);
        expect(updated.from.getTime()).toBeLessThan(original.from.getTime());
        expect(updated.to.getTime()).toBeGreaterThan(original.to.getTime());
      }).toPass({ timeout: 5000 });
    });

    test('"t left" shifts time range backward', async ({ exploreProfilesPage, page }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      const originalText = await exploreProfilesPage.getTimePickerButton().textContent();
      const original = parseTimeRange(originalText!);

      // Press "t left" to shift backward
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowLeft');

      await expect(async () => {
        const newText = await exploreProfilesPage.getTimePickerButton().textContent();
        const updated = parseTimeRange(newText!);
        expect(updated.from.getTime()).toBeLessThan(original.from.getTime());
        expect(updated.to.getTime()).toBeLessThan(original.to.getTime());
      }).toPass({ timeout: 5000 });
    });

    test('"t right" shifts time range forward', async ({ exploreProfilesPage, page }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      const originalText = await exploreProfilesPage.getTimePickerButton().textContent();
      const original = parseTimeRange(originalText!);

      // Press "t right" to shift forward
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowRight');

      await expect(async () => {
        const newText = await exploreProfilesPage.getTimePickerButton().textContent();
        const updated = parseTimeRange(newText!);
        expect(updated.from.getTime()).toBeGreaterThan(original.from.getTime());
        expect(updated.to.getTime()).toBeGreaterThan(original.to.getTime());
      }).toPass({ timeout: 5000 });
    });

    test('"d r" refreshes the dashboard', async ({ exploreProfilesPage, page }) => {
      await exploreProfilesPage.goto(ExplorationType.FlameGraph);

      // Wait for initial load
      await exploreProfilesPage.assertSelectedService('ride-sharing-app');

      // Listen for any data-source request triggered by the refresh
      const requestPromise = page.waitForRequest(
        (request) => request.url().includes('/ds/') && request.method() === 'POST',
        { timeout: 10000 }
      );

      // Press "d r" to refresh
      await page.keyboard.press('d');
      await page.keyboard.press('r');

      // Verify that a new request was made (the refresh triggered new data fetching)
      await expect(requestPromise).resolves.toBeTruthy();
    });
  });

  test.describe('Diff flame graph view - multiple time pickers', () => {
    test('"t left" after clicking baseline picker shifts only baseline time range', async ({
      exploreProfilesPage,
      page,
    }) => {
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);

      const baselineBefore = parseTimeRange(
        (await exploreProfilesPage.getComparisonTimePickerButton('baseline').textContent())!
      );
      const comparisonBefore = await exploreProfilesPage.getComparisonTimePickerButton('comparison').textContent();

      // Click the baseline time picker to mark it as the active one
      await exploreProfilesPage.getComparisonTimePickerButton('baseline').click();
      await page.keyboard.press('Escape');

      // Press "t left" to shift backward
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowLeft');

      // The baseline time range should have shifted backward
      await expect(async () => {
        const baselineAfter = parseTimeRange(
          (await exploreProfilesPage.getComparisonTimePickerButton('baseline').textContent())!
        );
        expect(baselineAfter.from.getTime()).toBeLessThan(baselineBefore.from.getTime());
        expect(baselineAfter.to.getTime()).toBeLessThan(baselineBefore.to.getTime());
      }).toPass({ timeout: 5000 });

      // The comparison time range should be unchanged
      const comparisonAfter = await exploreProfilesPage.getComparisonTimePickerButton('comparison').textContent();
      expect(comparisonAfter).toBe(comparisonBefore);
    });

    test('"t left" after clicking comparison picker shifts only comparison time range', async ({
      exploreProfilesPage,
      page,
    }) => {
      await exploreProfilesPage.goto(ExplorationType.DiffFlameGraph, EXPLORE_PROFILES_DIFF_RANGES_URL_PARAMS);

      const baselineBefore = await exploreProfilesPage.getComparisonTimePickerButton('baseline').textContent();
      const comparisonBefore = parseTimeRange(
        (await exploreProfilesPage.getComparisonTimePickerButton('comparison').textContent())!
      );

      // Click the comparison time picker to mark it as the active one
      await exploreProfilesPage.getComparisonTimePickerButton('comparison').click();
      await page.keyboard.press('Escape');

      // Press "t left" to shift backward
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowLeft');

      // The comparison time range should have shifted backward
      await expect(async () => {
        const comparisonAfter = parseTimeRange(
          (await exploreProfilesPage.getComparisonTimePickerButton('comparison').textContent())!
        );
        expect(comparisonAfter.from.getTime()).toBeLessThan(comparisonBefore.from.getTime());
        expect(comparisonAfter.to.getTime()).toBeLessThan(comparisonBefore.to.getTime());
      }).toPass({ timeout: 5000 });

      // The baseline time range should be unchanged
      const baselineAfter = await exploreProfilesPage.getComparisonTimePickerButton('baseline').textContent();
      expect(baselineAfter).toBe(baselineBefore);
    });
  });
});
