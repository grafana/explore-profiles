import { DataSourceInstanceSettings, DataSourceJsonData } from '@grafana/data';
import { config } from '@grafana/runtime';

import { userStorage } from '../userStorage';
import { HttpClient } from './HttpClient';

const PYROSCOPE_DATA_SOURCES_TYPE = 'grafana-pyroscope-datasource';
const PYROSCOPE_URL_SEARCH_PARAM_NAME = 'var-dataSource'; // matches with the Scenes library

type CustomDataSourceJsonData = { overridesDefault: boolean };
type CustomDataSourceInstanceSettings = DataSourceInstanceSettings<DataSourceJsonData & CustomDataSourceJsonData>;

/**
 * An HTTP client ready to fetch data from the plugin's backend
 */
export class ApiClient extends HttpClient {
  static getPyroscopeDataSources() {
    return Object.values(config.datasources).filter((ds) => ds.type === PYROSCOPE_DATA_SOURCES_TYPE);
  }

  static selectDefaultDataSource() {
    const pyroscopeDataSources = ApiClient.getPyroscopeDataSources() as CustomDataSourceInstanceSettings[];

    const uidFromUrl = new URL(window.location.href).searchParams.get(PYROSCOPE_URL_SEARCH_PARAM_NAME);
    const uidFromLocalStorage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.dataSource;

    const defaultDataSource =
      pyroscopeDataSources.find((ds) => ds.uid === uidFromUrl) ||
      pyroscopeDataSources.find((ds) => ds.uid === uidFromLocalStorage) ||
      pyroscopeDataSources.find((ds) => ds.jsonData.overridesDefault) ||
      pyroscopeDataSources.find((ds) => ds.isDefault) ||
      pyroscopeDataSources[0];

    if (!defaultDataSource) {
      console.warn(
        'Cannot find any Pyroscope data source! Please add and configure a Pyroscope data source to your Grafana instance.'
      );

      // because we instantiate most of our API clients before exporting them,
      // we have to return a dummy data source to prevent the whole app to fail
      return { uid: 'no-data-source-configured' };
    }

    return defaultDataSource;
  }

  static getBaseUrl() {
    const pyroscopeDataSource = ApiClient.selectDefaultDataSource();

    let appUrl = config.appUrl;
    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    return new URL(`api/datasources/proxy/uid/${pyroscopeDataSource.uid}`, appUrl);
  }

  constructor() {
    super(ApiClient.getBaseUrl().toString(), {
      'content-type': 'application/json',
      'X-Grafana-Org-Id': String(config.bootData?.user?.orgId || ''),
    });
  }
}
