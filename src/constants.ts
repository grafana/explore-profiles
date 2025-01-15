import plugin from './plugin.json';

export const PYROSCOPE_APP_ID = plugin.id;

export const PLUGIN_BASE_URL = `/a/${PYROSCOPE_APP_ID}`;

export enum ROUTES {
  PROFILES_EXPLORER_VIEW = '/profiles-explorer',
  ADHOC_VIEW = '/ad-hoc',
  SETTINGS = '/settings',
  EXPORTED_METRICS_VIEW = '/exported-metrics',
}
