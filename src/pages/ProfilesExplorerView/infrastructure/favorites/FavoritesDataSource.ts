import {
  AdHocVariableFilter,
  DataQueryResponse,
  FieldType,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';
import { isEqual } from 'lodash';

import { PanelType } from '../../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { PYROSCOPE_FAVORITES_DATA_SOURCE } from '../pyroscope-data-sources';
import { getProfileMetricLabel } from '../series/helpers/getProfileMetricLabel';

export type Favorite = {
  index: number; // for colouring purpose only
  queryRunnerParams: {
    serviceName: string;
    profileMetricId: string;
    groupBy?: {
      label: string;
    };
    filters?: AdHocVariableFilter[];
  };
  panelType?: PanelType;
};

export class FavoritesDataSource extends RuntimeDataSource {
  static getAllFavorites() {
    return userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];
  }

  static areFavoritesEqual(f1: Favorite, f2: Favorite) {
    return f1.panelType === f2.panelType && isEqual(f1.queryRunnerParams, f2.queryRunnerParams);
  }

  static exists(favorite: Favorite) {
    return FavoritesDataSource.getAllFavorites().some((f: Favorite) =>
      FavoritesDataSource.areFavoritesEqual(f, favorite)
    );
  }

  static addFavorite(favorite: Favorite) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
    storage.favorites.push(favorite);
    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  static removeFavorite(favorite: Favorite) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
    storage.favorites = storage.favorites.filter((f: Favorite) => !FavoritesDataSource.areFavoritesEqual(f, favorite));
    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  constructor() {
    super(PYROSCOPE_FAVORITES_DATA_SOURCE.type, PYROSCOPE_FAVORITES_DATA_SOURCE.uid);

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    // ensures backward compatibility for older favorites without panel type
    storage.favorites = storage.favorites.map((f: Favorite) => ({
      panelType: PanelType.TIMESERIES,
      ...f,
    }));

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  async query(): Promise<DataQueryResponse> {
    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Favories',
          fields: [
            {
              name: null,
              type: FieldType.other,
              values: [],
              config: {},
            },
          ],
          length: 0,
        },
      ],
    };
  }

  async metricFindQuery(): Promise<MetricFindValue[]> {
    return FavoritesDataSource.getAllFavorites().map((f: Favorite) => {
      const { serviceName, profileMetricId, groupBy, filters } = f.queryRunnerParams || {};
      const textParts = [serviceName, getProfileMetricLabel(profileMetricId)];

      if (groupBy?.label) {
        textParts.push(groupBy.label);
      }

      if (filters?.length) {
        textParts.push(filters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(', '));
      }

      return {
        value: JSON.stringify({ value: JSON.stringify(f), ...f }),
        text: textParts.join(' · '),
      };
    });
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
