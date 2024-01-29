import { NavModelItem } from '@grafana/data';

import { id } from './plugin.json';

export const PYROSCOPE_APP_ID = id;

export const PLUGIN_BASE_URL = `/a/${PYROSCOPE_APP_ID}`;

export enum ROUTES {
  EXPLORE_VIEW = '/tag-explorer',
  SINGLE_VIEW = '/single',
  COMPARISON_VIEW = '/comparison',
  COMPARISON_DIFF_VIEW = '/comparison-diff',
  ADHOC_VIEW = '/ad-hoc',
  SINGLE_VIEW_AI = '/single-ai',
  COMPARISON_DIFF_VIEW_AI = '/comparison-diff-ai',
  SETTINGS = '/settings',
}

export const APP_TITLE = 'Profiles';

// Add a navigation item for each route you would like to display in the navigation bar
export const NAVIGATION: Record<string, NavModelItem> = {
  [ROUTES.EXPLORE_VIEW]: {
    id: ROUTES.EXPLORE_VIEW,
    text: 'Tag Explorer',
    url: `${PLUGIN_BASE_URL}/tag-explorer`,
  },
  [ROUTES.SINGLE_VIEW]: {
    id: ROUTES.SINGLE_VIEW,
    text: 'Single View',
    url: `${PLUGIN_BASE_URL}/single`,
  },
  [ROUTES.COMPARISON_VIEW]: {
    id: ROUTES.COMPARISON_VIEW,
    text: 'Comparison View',
    url: `${PLUGIN_BASE_URL}/comparison`,
  },
  [ROUTES.COMPARISON_DIFF_VIEW]: {
    id: ROUTES.COMPARISON_DIFF_VIEW,
    text: 'Diff View',
    url: `${PLUGIN_BASE_URL}/comparison-diff`,
  },
  [ROUTES.ADHOC_VIEW]: {
    id: ROUTES.ADHOC_VIEW,
    text: 'Ad hoc View',
    url: `${PLUGIN_BASE_URL}/ad-hoc`,
  },
  [ROUTES.SINGLE_VIEW_AI]: {
    id: ROUTES.SINGLE_VIEW_AI,
    text: 'Single View AI',
    url: `${PLUGIN_BASE_URL}/single-ai`,
  },
  [ROUTES.COMPARISON_DIFF_VIEW_AI]: {
    id: ROUTES.COMPARISON_DIFF_VIEW_AI,
    text: 'Diff View AI',
    url: `${PLUGIN_BASE_URL}/comparison-diff-ai`,
  },
  [ROUTES.SETTINGS]: {
    id: ROUTES.SETTINGS,
    text: 'Settings',
    url: `${PLUGIN_BASE_URL}/settings`,
  },
};
