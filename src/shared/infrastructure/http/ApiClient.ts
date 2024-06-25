import { config } from '@grafana/runtime';

import { HttpClient } from './HttpClient';

const PYROSCOPE_DATA_SOURCES_TYPE = 'grafana-pyroscope-datasource';
const PYROSCOPE_URL_SEARCH_PARAM_NAME = 'var-dataSource'; // matches with the Scenes library

/**
 * An HTTP client ready to fetch data from the plugin's backend
 */
export class ApiClient extends HttpClient {
  constructor() {
    let { appUrl, bootData, datasources } = config;

    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const pyroscopeDataSources = Object.values(datasources).filter(({ type }) => type === PYROSCOPE_DATA_SOURCES_TYPE);
    const initDataSourceName = new URL(window.location.toString()).searchParams.get(PYROSCOPE_URL_SEARCH_PARAM_NAME);

    const pyroscopeDataSource =
      pyroscopeDataSources.find(({ uid }) => uid === initDataSourceName) ||
      pyroscopeDataSources.find(({ isDefault }) => isDefault);

    if (!pyroscopeDataSource) {
      throw new Error(
        'Cannot find any Pyroscope data source! Please configure add at least one Pyroscope data source.'
      );
    }

    const apiBaseUrl = new URL(`api/datasources/proxy/uid/${pyroscopeDataSource.uid}`, appUrl);

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
      'X-Grafana-Org-Id': String(bootData?.user?.orgId || ''),
    });
  }
}
