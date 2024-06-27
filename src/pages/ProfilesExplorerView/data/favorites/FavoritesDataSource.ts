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
};

export class FavoritesDataSource extends RuntimeDataSource {
  static exists(favorite: Favorite) {
    return userStorage
      .get(userStorage.KEYS.PROFILES_EXPLORER)
      ?.favorites?.some((f: Favorite) => isEqual(f.queryRunnerParams, favorite.queryRunnerParams));
  }

  static addFavorite(favorite: Favorite) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    storage.favorites.push(favorite);

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  static removeFavorite(favorite: Favorite) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    const { queryRunnerParams } = favorite;

    storage.favorites = storage.favorites.filter((f: Favorite) => !isEqual(f.queryRunnerParams, queryRunnerParams));

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  constructor() {
    super(PYROSCOPE_FAVORITES_DATA_SOURCE.type, PYROSCOPE_FAVORITES_DATA_SOURCE.uid);
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
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    return favorites.map((f: Favorite) => {
      const { serviceName, profileMetricId, groupBy, filters } = f.queryRunnerParams;
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
