import plugin from './plugin.json';

export const PYROSCOPE_APP_ID = plugin.id;

export const PLUGIN_BASE_URL = `/a/${PYROSCOPE_APP_ID}`;

export enum ROUTES {
  EXPLORE = '/explore',
  ADHOC = '/ad-hoc',
  SETTINGS = '/settings',
  RECORDING_RULES = '/recording-rules',
  GITHUB_CALLBACK = '/github/callback',
}
