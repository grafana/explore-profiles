import { Project, defineConfig } from '@playwright/test';
import path from 'path';

type CustomEnvConfig = {
  baseURL: string;
  projects?: Project[];
  timeout?: number;
};

export function config(config: CustomEnvConfig) {
  return defineConfig({
    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: path.join(process.cwd(), 'e2e', 'tests'),
    // Folder for test artifacts such as screenshots, videos, traces, etc.
    outputDir: '../test-results',
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['html', { outputFolder: '../test-reports', open: process.env.CI ? 'never' : 'on-failure' }]],
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
      /* Base URL to use in actions like `await page.goto('/')`. */
      baseURL: config.baseURL,
      // Record trace only when retrying a test for the first time.
      screenshot: 'only-on-failure',
      // Record video only when retrying a test for the first time.
      video: 'on-first-retry',
      /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
      trace: 'on-first-retry',
    },
    expect: {
      timeout: Number(config.timeout) > 0 ? config.timeout : 5000,
      toHaveScreenshot: { maxDiffPixelRatio: 0.01 }, // tweak me with experience
    },

    /* Configure projects for major browsers */
    projects: config.projects,
  });
}