import { devices } from '@playwright/test';
import path from 'path';

import { AUTH_FILE, CHROMIUM_VIEWPORT, ENV_VARS } from './constants';
import { config } from './playwright.config.common';

const shouldAuthenticate = !ENV_VARS.E2E_BASE_URL.startsWith('http://localhost');

const projects = shouldAuthenticate
  ? [
      {
        name: 'authenticate',
        testDir: path.join(process.cwd(), 'e2e', 'setup'),
      },
      {
        name: 'chromium',
        dependencies: ['authenticate'],
        testDir: path.join(process.cwd(), 'e2e', 'tests'),
        use: {
          ...devices['Desktop Chrome'],
          viewport: CHROMIUM_VIEWPORT,
          storageState: AUTH_FILE, // Use prepared auth state.
        },
      },
    ]
  : [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          viewport: CHROMIUM_VIEWPORT,
        },
      },
    ];

export default config({
  baseURL: ENV_VARS.E2E_BASE_URL,
  projects,
  // we use the "list" reporter instead of the "dot" one, because it doesn't show in GitHub actions logs
  reporter: [['list'], ['html', { outputFolder: '../test-reports', open: 'never' }], ['github']],
  retries: 1,
  forbidOnly: true,
  workers: 2,
});
