import plugin from './plugin.json';

export const PYROSCOPE_APP_ID = plugin.id;

export const PLUGIN_BASE_URL = `/a/${PYROSCOPE_APP_ID}`;

export enum ROUTES {
  EXPLORE_VIEW = '/tag-explorer',
  PROFILES_EXPLORER = '/profiles-explorer',
  SINGLE_VIEW = '/single',
  COMPARISON_VIEW = '/comparison',
  COMPARISON_DIFF_VIEW = '/comparison-diff',
  ADHOC_VIEW = '/ad-hoc',
  SETTINGS = '/settings',
}
