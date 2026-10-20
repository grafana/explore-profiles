import { DataSourceInstanceSettings } from '@grafana/data';
import {
  getDataSourceInstanceList,
  getDataSourceInstanceSettings,
  getDefaultDataSourceInstanceListItem,
} from '@grafana/plugin-compat/datasources';
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

let pending: Promise<CustomDataSourceInstanceSettings | undefined> | undefined;

async function getPyroscopeDataSources(): Promise<CustomDataSourceInstanceSettings[]> {
  const instances = await getDataSourceInstanceList({ pluginId: PYROSCOPE_DATA_SOURCES_TYPE });
  const allSettings = await Promise.all(instances.map((i) => getDataSourceInstanceSettings(i.uid)));
  return allSettings.filter(Boolean) as CustomDataSourceInstanceSettings[];
}

async function getDefaultPyroscopeDataSource(): Promise<CustomDataSourceInstanceSettings | undefined> {
  const instances = await getDataSourceInstanceList({ pluginId: PYROSCOPE_DATA_SOURCES_TYPE });
  const defaultDs = await getDefaultDataSourceInstanceListItem(instances);
  return defaultDs;
}

async function internalGetSelectedDefaultDataSource(): Promise<CustomDataSourceInstanceSettings | undefined> {
  const pyroscopeDataSources = await getPyroscopeDataSources();
  const defaultDs = await getDefaultPyroscopeDataSource();

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

  return defaultDataSource;
}

export async function getSelectedDefaultDataSource(): Promise<CustomDataSourceInstanceSettings | undefined> {
  if (pending) {
    return pending;
  }

  pending = internalGetSelectedDefaultDataSource().finally(() => {
    pending = undefined;
  });

  return pending;
}

export function useSelectDefaultDataSourceUid({ selectedUid }: SelectedDataSourceUidInput) {
  const needsDefault = selectedUid === undefined;
  const [state, resolve] = useAsyncFn(async () => (await getSelectedDefaultDataSource())?.uid, [], {
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
  const { loading, error, value: datasources } = useAsync(getPyroscopeDataSources, []);
  return { loading, error, datasources };
}
