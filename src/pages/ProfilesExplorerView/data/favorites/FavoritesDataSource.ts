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

import { PYROSCOPE_PROFILE_FAVORITES_DATA_SOURCE } from '../pyroscope-data-sources';
import { getProfileMetricLabel } from '../series/helpers/getProfileMetricLabel';

export type Favorite = {
  index: number; // for colouring purpose only
  queryRunnerParams: {
    serviceName: string;
    profileMetricId: string;
    groupBy?: {
      label?: string;
    };
    filters?: AdHocVariableFilter[];
  };
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

  constructor() {
    super(PYROSCOPE_PROFILE_FAVORITES_DATA_SOURCE.type, PYROSCOPE_PROFILE_FAVORITES_DATA_SOURCE.uid);
  }

  async query(): Promise<DataQueryResponse> {
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    const values = favorites.map((f: Favorite) => {
      const { serviceName, profileMetricId, groupBy, filters } = f.queryRunnerParams;
      const labelParts = [serviceName, getProfileMetricLabel(profileMetricId)];

      if (groupBy?.label) {
        labelParts.push(groupBy.label);
      }

      if (filters?.length) {
        labelParts.push(filters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(', '));
      }

      return {
        index: f.index,
        value: groupBy ? `${serviceName}-${profileMetricId}-${groupBy.label}` : `${serviceName}-${profileMetricId}`,
        label: labelParts.join(' · '),
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
      const profileMetricLabel = getProfileMetricLabel(profileMetricId);

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