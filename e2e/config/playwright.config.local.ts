import { devices } from '@playwright/test';
import path from 'path';

import { AUTH_FILE, CHROMIUM_VIEWPORT, ENV_VARS } from './constants';
import { config } from './playwright.config.common';

const shouldAuthenticate = !ENV_VARS.E2E_BASE_URL.startsWith('http://localhost');
const failOnUncaughtExceptions = false;

// Recording-rules tests modify shared plugin settings and must not run in parallel
// with settings-view tests (which reset all settings in afterEach). We isolate them
// into a separate project that runs after the main tests complete.
const recordingRulesProject = (deps: string[]) => ({
  name: 'recording-rules',
  dependencies: deps,
  testDir: path.join(process.cwd(), 'e2e', 'tests'),
  testMatch: ['recording-rules/**'],
  use: {
    ...devices['Desktop Chrome'],
    viewport: CHROMIUM_VIEWPORT,
    failOnUncaughtExceptions,
    ...(shouldAuthenticate ? { storageState: AUTH_FILE } : {}),
  },
});

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
        testIgnore: ['recording-rules/**'],
        use: {
          ...devices['Desktop Chrome'],
          viewport: CHROMIUM_VIEWPORT,
          storageState: AUTH_FILE, // Use prepared auth state.
          failOnUncaughtExceptions,
        },
      },
      recordingRulesProject(['chromium']),
    ]
  : [
      {
        name: 'chromium',
        testIgnore: ['recording-rules/**'],
        use: {
          ...devices['Desktop Chrome'],
          viewport: CHROMIUM_VIEWPORT,
          failOnUncaughtExceptions,
        },
      },
      recordingRulesProject(['chromium']),
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
