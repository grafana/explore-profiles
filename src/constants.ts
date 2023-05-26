import { NavModelItem } from '@grafana/data';
import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  EXPLORE_VIEW = '/tag-explorer',
  SINGLE_VIEW = '/single',
  COMPARISON_VIEW = '/comparison',
  COMPARISON_DIFF_VIEW = '/comparison-diff',
}

export const NAVIGATION_TITLE = 'Pyroscope App Plugin';
export const NAVIGATION_SUBTITLE = '';

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
};
