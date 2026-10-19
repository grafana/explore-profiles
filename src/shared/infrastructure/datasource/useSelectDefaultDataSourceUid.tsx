import { DataSourceInstanceSettings } from '@grafana/data';
import { config } from '@grafana/runtime';
import { DataSourceJsonData } from '@grafana/schema';
import { useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { PYROSCOPE_DATA_SOURCES_TYPE, PYROSCOPE_URL_SEARCH_PARAM_NAME } from 'src/constants';

import { logger } from '../tracking/logger';
import { userStorage } from '../userStorage';

export interface SelectedDataSourceUidInput {
  selectedUid?: string;
}

type CustomDataSourceJsonData = { overridesDefault: boolean };
type CustomDataSourceInstanceSettings = DataSourceInstanceSettings<DataSourceJsonData & CustomDataSourceJsonData>;

async function getDataSourceInstanceSettingsList(): Promise<CustomDataSourceInstanceSettings[]> {
  return Object.values(config.datasources).filter(
    (ds) => ds.type === PYROSCOPE_DATA_SOURCES_TYPE
  ) as CustomDataSourceInstanceSettings[];
}

async function getDefaultDataSourceInstance(
  settings: CustomDataSourceInstanceSettings[]
): Promise<CustomDataSourceInstanceSettings | undefined> {
  return settings.find((s) => s.isDefault);
}

export async function getSelectedDefaultDataSource() {
  const pyroscopeDataSources = await getDataSourceInstanceSettingsList();
  const defaultDs = await getDefaultDataSourceInstance(pyroscopeDataSources);

  const uidFromUrl = new URL(window.location.href).searchParams.get(PYROSCOPE_URL_SEARCH_PARAM_NAME);
  const uidFromLocalStorage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.dataSource;

  const defaultDataSource =
    pyroscopeDataSources.find((ds) => ds.uid === uidFromUrl) ||
    pyroscopeDataSources.find((ds) => ds.uid === uidFromLocalStorage) ||
    pyroscopeDataSources.find((ds) => ds.jsonData.overridesDefault) ||
    pyroscopeDataSources.find((ds) => ds.uid === defaultDs?.uid) ||
    pyroscopeDataSources[0];

  if (!defaultDataSource) {
    logger.warn(
      'Cannot find any Pyroscope data source! Please add and configure a Pyroscope data source to your Grafana instance.'
    );
  }

  // because we instantiate most of our API clients before exporting them,
  // we have to return a dummy data source to prevent the whole app to fail
  return defaultDataSource ?? { uid: 'no-data-source-configured' };
}

export function useSelectDefaultDataSourceUid({ selectedUid }: SelectedDataSourceUidInput) {
  const needsDefault = selectedUid === undefined;
  const [state, resolve] = useAsyncFn(async () => (await getSelectedDefaultDataSource()).uid, [], {
    loading: needsDefault,
  });

  useEffect(() => {
    if (needsDefault) {
      resolve();
    }
  }, [needsDefault, resolve]);

  return state;
}

export function usePyroscopeDataSources() {
  const { loading, error, value: datasources } = useAsync(getDataSourceInstanceSettingsList, []);
  return { loading, error, datasources };
}
