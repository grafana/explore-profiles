import { getBackendSrv } from '@grafana/runtime';
import { PYROSCOPE_APP_ID } from '../../constants';
import { PyroscopeAppSettings } from './types';

/* Global promise to fetch the pyroscope app settings */
let pyroscopeAppSettings: PyroscopeAppSettings | undefined = undefined;

function fetchPluginConfig() {
  const params = null;
  const requestId = PYROSCOPE_APP_ID;
  getBackendSrv()
    .get<PyroscopeAppSettings>(`/api/plugins/${PYROSCOPE_APP_ID}/settings`, params, requestId, {})
    .then((settings) => {
      pyroscopeAppSettings = settings;
    })
    .catch(() => {});
}

// We must ensure this is fetched immediately when the javascript is loaded (only once)
fetchPluginConfig();

export function getPluginSettings() {
  // The extension does not allow async calls, so we will have to handle race conditions...
  // This value MAY be null early
  return pyroscopeAppSettings;
}
