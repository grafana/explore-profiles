import {
  DataQueryResponse,
  FieldType,
  LoadingState,
  MetricFindValue,
  shallowCompare,
  TestDataSourceResponse,
} from '@grafana/data';
import { RuntimeDataSource } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';
import { isEqual, omit } from 'lodash';

import { ProfileMetricsDataSource } from './ProfileMetricsDataSource';

export type Favorite = {
  serviceName: string;
  profileMetricId: string;
  color?: string;
  groupBy?: {
    label: string;
    values: string[];
  };
};

export class FavoritesDataSource extends RuntimeDataSource {
  static exists(favorite: Favorite) {
    const favoriteForCompare = omit(favorite, 'color');

    return userStorage
      .get(userStorage.KEYS.PROFILES_EXPLORER)
      ?.favorites?.some((f: Favorite) => isEqual(omit(f, 'color'), favoriteForCompare));
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

    const favoriteForCompare = omit(favorite, 'color');

    storage.favorites = storage.favorites.filter(
      (f: Favorite) => !shallowCompare(omit(f, 'color'), favoriteForCompare)
    );

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  }

  async query(): Promise<DataQueryResponse> {
    const favorites = await this.metricFindQuery();

    const values = favorites.map(({ value, text }) => {
      const f = value as unknown as Favorite;
      return {
        value: `${f.serviceName}-${f.profileMetricId}`,
        label: text,
        color: f.color,
        queryRunnerParams: omit(f, 'color'),
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
              config: {
                queryRunnersParams: {},
              },
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
      const profileMetricLabel = ProfileMetricsDataSource.getProfileMetricLabel(f.profileMetricId);

      return {
        value: f,
        text: f.groupBy
          ? `${f.serviceName} · ${profileMetricLabel} · ${f.groupBy.label}`
          : `${f.serviceName} · ${profileMetricLabel}`,
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
