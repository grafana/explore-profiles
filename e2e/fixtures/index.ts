import { test as base, expect } from '@playwright/test';
import { ComparisonDiffViewPage } from './pages/ComparisonDiffViewPage';
import { ComparisonViewPage } from './pages/ComparisonViewPage';
import { SingleViewPage } from './pages/SingleViewPage';
import { TagExplorerPage } from './pages/TagExplorerPage';
import { DEFAULT_URL_PARAMS } from '../config/constants';

type Fixtures = {
  tagExplorerPage: TagExplorerPage;
  singleViewPage: SingleViewPage;
  comparisonViewPage: ComparisonViewPage;
  comparisonDiffViewPage: ComparisonDiffViewPage;
};

type Options = {
  failOnUncaughtExceptions: boolean;
};

const withExceptionsAssertion = async ({ page, failOnUncaughtExceptions, use }, fixture) => {
  if (!failOnUncaughtExceptions) {
    return await use(fixture);
  }

  const exceptions: Error[] = [];

  page.addListener('pageerror', (error) => {
    exceptions.push(error);
  });

  await use(fixture);

  expect(exceptions, `${exceptions.length} uncaught exception(s) encountered!`).toEqual([]);
};

export const test = base.extend<Options & Fixtures>({
  // fixture option accessible in every test case or fixture (default value = false)
  failOnUncaughtExceptions: [false, { option: true }],
  tagExplorerPage: async ({ page, failOnUncaughtExceptions }, use) => {
    await withExceptionsAssertion(
      { page, failOnUncaughtExceptions, use },
      new TagExplorerPage(page, DEFAULT_URL_PARAMS)
    );
  },
  singleViewPage: async ({ page, failOnUncaughtExceptions }, use) => {
    await withExceptionsAssertion(
      { page, failOnUncaughtExceptions, use },
      new SingleViewPage(page, DEFAULT_URL_PARAMS)
    );
  },
  comparisonViewPage: async ({ page, failOnUncaughtExceptions }, use) => {
    await withExceptionsAssertion(
      { page, failOnUncaughtExceptions, use },
      new ComparisonViewPage(page, DEFAULT_URL_PARAMS)
    );
  },
  comparisonDiffViewPage: async ({ page, failOnUncaughtExceptions }, use) => {
    await withExceptionsAssertion(
      { page, failOnUncaughtExceptions, use },
      new ComparisonDiffViewPage(page, DEFAULT_URL_PARAMS)
    );
  },
});

export { expect } from '@playwright/test';
