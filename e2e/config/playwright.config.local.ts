import { devices } from '@playwright/test';
import { config } from './playwright.config.common';
import { ENV_VARS, AUTH_FILE } from './constants';
import path from 'path';

const shouldAuthenticate = !ENV_VARS.E2E_BASE_URL.startsWith('http://localhost');

const projects = shouldAuthenticate
  ? [
      {
        name: 'authenticate',
        testDir: path.join(process.cwd(), 'e2e', 'setup'),
      },
      {
        name: 'chromium',
        testDir: path.join(process.cwd(), 'e2e', 'tests'),
        use: {
          ...devices['Desktop Chrome'],
          storageState: AUTH_FILE, // Use prepared auth state.
        },
        dependencies: ['authenticate'],
      },
    ]
  : [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
        },
      },
    ];

export default config({
  baseURL: ENV_VARS.E2E_BASE_URL,
  projects,
  reporter: [
    ['list', { printSteps: true }],
    ['html', { outputFolder: '../test-reports', open: 'on-failure' }],
  ],
});
