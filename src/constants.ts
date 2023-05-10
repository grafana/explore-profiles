import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  SINGLE_VIEW = '/',
  COMPARISON_VIEW = '/comparison',
  COMPARISON_DIFF_VIEW = '/comparison-diff',
}
