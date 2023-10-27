import { TimeRange } from '@grafana/data';
import { PYROSCOPE_APP_ID } from '../../constants';
import { translateGrafanaTimeRangeToPyroscope } from '../../utils/translation';
import { getPluginSettings } from './pluginSettings';
import { ExtensionQueryLinksContext, PyroscopeAppSettings, PyroscopeDatasourceSettings, Query } from './types';

/**
 * In a normal Grafana Cloud stack, the same pyroscope datasource that this app plugin
 * is configured to connect to will have this `uid`. It is a constant for all instances.
 * It is technically possible for someone with gcom capabilities to MANUALLY change the 
 * credentials and URL to be different between the two, but this is not a likely scenario.
 * In the future we DO plan on making this app plugin compatible with all pyroscope datasources
 * instead of specifically one, but that is not currently a high priority.
 * In the meantime, we use this as a hard-coded initial check until we can determine
 * whether or not the datasource advertised by the extension matches the pyroscope this
 * app is connected to. The consequences of a misloading datasource uid are brief, 
 * as `isPyroscopeDatasourceCompatibleWithPlugin` will be re-evaluated each time the
 * query editor's parameters change in any way.
 * 
 * To see this datasource configuration, use the following URL:
 * https://[GrafanaCloudBaseURL]/api/datasources/uid/grafanacloud-profiles
 */
const ASSUMED_CLOUD_PROFILES_DATASOURCE_UID = 'grafanacloud-profiles';

export function isPyroscopeDatasourceCompatibleWithPlugin(
  datasource?: PyroscopeDatasourceSettings,
  appPlugin?: PyroscopeAppSettings
) {
  if (!datasource) {
    return false;
  }

  if (!appPlugin) {
    // We don't have enough information *yet*, so we boldly assume based on the constant ID.
    return (datasource.uid === ASSUMED_CLOUD_PROFILES_DATASOURCE_UID);
  }

  return (
    datasource.url === appPlugin.jsonData?.backendUrl && datasource.basicAuthUser === appPlugin.jsonData.basicAuthUser
  );
}

export function generateQueryParams(query: Query, range?: TimeRange) {
  if (!range) {
    return '';
  }
  const { labelSelector, profileTypeId } = query;

  const params = new URLSearchParams();

  if (profileTypeId) {
    params.set('query', profileTypeId + (labelSelector || ''));
  }

  if (range) {
    const { from, until } = translateGrafanaTimeRangeToPyroscope(range);
    params.set('from', from);
    params.set('until', until);
  }

  return params.toString();
}



export default function configure(context?: ExtensionQueryLinksContext) {
  if (!context) {
    return undefined;
  }

  const pluginConfig = getPluginSettings();

  const { query, range, datasourceSettings } = context;

  if (!isPyroscopeDatasourceCompatibleWithPlugin(datasourceSettings, pluginConfig)) {
    // This will cause the extension button to not appear.
    return undefined;
  }

  const params = generateQueryParams(query, range);
  const path = `/a/${PYROSCOPE_APP_ID}/single?${params}`;

  return {
    onClick: undefined,
    path,
  };
}
