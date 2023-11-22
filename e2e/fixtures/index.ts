import { test as base } from '@playwright/test';
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

export const test = base.extend<Fixtures>({
  tagExplorerPage: async ({ page }, use) => {
    await use(new TagExplorerPage(page, DEFAULT_URL_PARAMS));
  },
  singleViewPage: async ({ page }, use) => {
    await use(new SingleViewPage(page, DEFAULT_URL_PARAMS));
  },
  comparisonViewPage: async ({ page }, use) => {
    await use(new ComparisonViewPage(page, DEFAULT_URL_PARAMS));
  },
  comparisonDiffViewPage: async ({ page }, use) => {
    await use(new ComparisonDiffViewPage(page, DEFAULT_URL_PARAMS));
  },
});

export { expect } from '@playwright/test';
