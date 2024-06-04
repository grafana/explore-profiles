import { DataQueryResponse, FieldType, LoadingState, MetricFindValue, TestDataSourceResponse } from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';
import { isEqual } from 'lodash';

import { ProfileMetricsDataSource } from './ProfileMetricsDataSource';

export type Favorite = {
  queryRunnerParams: {
    serviceName: string;
    profileMetricId: string;
    groupBy: {
      label: string;
    };
  };
  index: number; // for colouring purpose only
};

export class FavoritesDataSource extends RuntimeDataSource {
  static exists(queryRunnerParams: Favorite['queryRunnerParams']) {
    return userStorage
      .get(userStorage.KEYS.PROFILES_EXPLORER)
      ?.favorites?.some((f: Favorite) => isEqual(f.queryRunnerParams, queryRunnerParams));
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

  async query(): Promise<DataQueryResponse> {
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    const values = favorites.map((f: Favorite) => {
      const { serviceName, profileMetricId, groupBy } = f.queryRunnerParams;
      const profileMetricLabel = ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId);

      return {
        index: f.index,
        value: groupBy ? `${serviceName}-${profileMetricId}-${groupBy.label}` : `${serviceName}-${profileMetricId}`,
        label: groupBy
          ? `${serviceName} · ${profileMetricLabel} · ${groupBy.label}`
          : `${serviceName} · ${profileMetricLabel}`,
        queryRunnerParams: f.queryRunnerParams,
      };
    });

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Favories',
          fields: [
            {
              name: null,
              type: FieldType.other,
              values,
              config: {},
            },
          ],
          length: values.length,
        },
      ],
    };
  }

  metricFindQuery(): Promise<MetricFindValue[]> {
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    return favorites.map((f: Favorite) => {
      const { serviceName, profileMetricId, groupBy } = f.queryRunnerParams;
      const profileMetricLabel = ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId);

      return {
        value: f,
        text: groupBy
          ? `${serviceName} · ${profileMetricLabel} · ${groupBy.label}`
          : `${serviceName} · ${profileMetricLabel}`,
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
