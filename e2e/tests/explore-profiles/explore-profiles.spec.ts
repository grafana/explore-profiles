import { DEFAULT_EXPLORE_PROFILES_URL_PARAMS } from '../../config/constants';
import { expect, test } from '../../fixtures';

test.describe('Explore Profiles', () => {
  test.describe('Smoke tests', () => {
    for (const { type, label } of [
      { type: 'all', label: 'All services' },
      { type: 'profiles', label: 'Profile types' },
      { type: 'labels', label: 'Labels' },
      { type: 'flame-graph', label: 'Flame graph' },
      { type: 'favorites', label: 'Favorites' },
    ]) {
      test(label, async ({ exploreProfilesPage }) => {
        const urlParams = new URLSearchParams(DEFAULT_EXPLORE_PROFILES_URL_PARAMS);

        urlParams.set('explorationType', type);
        await exploreProfilesPage.goto(urlParams.toString());

        expect(await exploreProfilesPage.getSelectedExplorationType()).toBe(label);
      });
    }
  });
});