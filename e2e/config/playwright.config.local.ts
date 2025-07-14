import { devices } from '@playwright/test';
import path from 'path';

import { AUTH_FILE, CHROMIUM_VIEWPORT, ENV_VARS } from './constants';
import { config } from './playwright.config.common';

const shouldAuthenticate = !ENV_VARS.E2E_BASE_URL.startsWith('http://localhost');
const failOnUncaughtExceptions = false;

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
          failOnUncaughtExceptions,
        },
      },
    ]
  : [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          viewport: CHROMIUM_VIEWPORT,
          failOnUncaughtExceptions,
        },
      },
    ];

export default config({
  baseURL: ENV_VARS.E2E_BASE_URL,
  projects,
  workers: 4,
  reporter: [
    ['list', { printSteps: true }],
    ['html', { outputFolder: '../test-reports', open: 'on-failure' }],
  ],
});
