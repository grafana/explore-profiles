import { ExplorationType } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('All services view - Filters', () => {
  test('var-filters is cleared when switching from Labels to All services', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.Labels);

    const filter = ['vehicle', '=', 'car'];
    await exploreProfilesPage.addFilter(filter);
    await exploreProfilesPage.assertFilters([filter]);

    await exploreProfilesPage.selectExplorationType('All services');
    await exploreProfilesPage.selectExplorationType('Labels');

    await exploreProfilesPage.assertFilters([]);
  });

  test('var-filters-all persists when switching away from All services and back', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.AllServices);

    const filter = ['vehicle', '=', 'car'];
    await exploreProfilesPage.addFilter(filter, 'filters-all');
    await exploreProfilesPage.assertFilters([filter], 'filters-all');

    await exploreProfilesPage.selectExplorationType('Labels');
    await exploreProfilesPage.selectExplorationType('All services');

    await exploreProfilesPage.assertFilters([filter], 'filters-all');
  });

  test('var-filters and var-filters-all are independent', async ({ exploreProfilesPage }) => {
    await exploreProfilesPage.goto(ExplorationType.AllServices);

    await exploreProfilesPage.addFilter(['region', '=', 'us-east'], 'filters-all');

    await exploreProfilesPage.selectExplorationType('Labels');
    await exploreProfilesPage.addFilter(['vehicle', '=', 'bike']);

    await exploreProfilesPage.selectExplorationType('All services');
    await exploreProfilesPage.assertFilters([['region', '=', 'us-east']], 'filters-all');

    await exploreProfilesPage.selectExplorationType('Labels');
    await exploreProfilesPage.assertFilters([]);
  });
});
