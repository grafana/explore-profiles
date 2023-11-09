import { test as base } from '@playwright/test';
import { TagExplorerPage } from './pages/TagExplorerPage';
import { SingleViewPage } from './pages/SingleViewPage';
import { ComparisonViewPage } from './pages/ComparisonViewPage';
import { ComparisonDiffViewPage } from './pages/ComparisonDiffViewPage';

type Fixtures = {
  tagExplorerPage: TagExplorerPage;
  singleViewPage: SingleViewPage;
  comparisonViewPage: ComparisonViewPage;
  comparisonDiffViewPage: ComparisonDiffViewPage;
};

export const test = base.extend<Fixtures>({
  tagExplorerPage: async ({ page }, use) => {
    await use(new TagExplorerPage(page));
  },
  singleViewPage: async ({ page }, use) => {
    await use(new SingleViewPage(page));
  },
  comparisonViewPage: async ({ page }, use) => {
    await use(new ComparisonViewPage(page));
  },
  comparisonDiffViewPage: async ({ page }, use) => {
    await use(new ComparisonDiffViewPage(page));
  },
});

export { expect } from '@playwright/test';
