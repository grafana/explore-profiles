import { DataSourceInstanceSettings, DataSourceJsonData } from '@grafana/data';
import { config } from '@grafana/runtime';

import { HttpClient } from './HttpClient';

const PYROSCOPE_DATA_SOURCES_TYPE = 'grafana-pyroscope-datasource';
const PYROSCOPE_URL_SEARCH_PARAM_NAME = 'var-dataSource'; // matches with the Scenes library

type CustomDataSourceJsonData = { overridesDefault: boolean };
type CustomDataSourceInstanceSettings = DataSourceInstanceSettings<DataSourceJsonData & CustomDataSourceJsonData>;

/**
 * An HTTP client ready to fetch data from the plugin's backend
 */
export class ApiClient extends HttpClient {
  static selectDefaultDataSource() {
    const pyroscopeDataSources = Object.values(config.datasources).filter(
      (ds) => ds.type === PYROSCOPE_DATA_SOURCES_TYPE
    ) as CustomDataSourceInstanceSettings[];

    const initDataSourceUid = new URL(window.location.href).searchParams.get(PYROSCOPE_URL_SEARCH_PARAM_NAME);

    return (
      pyroscopeDataSources.find((ds) => ds.uid === initDataSourceUid) ||
      pyroscopeDataSources.find((ds) => ds.jsonData.overridesDefault) ||
      pyroscopeDataSources.find((ds) => ds.isDefault) ||
      pyroscopeDataSources[0]
    );
  }

  static getBaseUrl() {
    const pyroscopeDataSource = ApiClient.selectDefaultDataSource();

    if (!pyroscopeDataSource) {
      throw new Error(
        'Cannot find any Pyroscope data source! Please configure add at least one Pyroscope data source.'
      );
    }

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
