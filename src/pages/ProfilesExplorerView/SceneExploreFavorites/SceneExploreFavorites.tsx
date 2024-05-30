import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';
import { omit } from 'lodash';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventViewDetails } from '../events/EventViewDetails';

interface SceneExploreFavoritesState extends EmbeddedSceneState {}

type Favorite = Record<string, any> & {
  serviceName: string;
  profileMetricId: string;
  color: string;
};

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    super({
      key: 'explore-favorites',
      body: new SceneTimeSeriesGrid({
        key: 'favorites-grid',
        dataSource: PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE,
        headerActions: (params) => [
          new SelectAction({ EventClass: EventViewDetails, params }),
          new FavAction({ params }),
        ],
      }),
    });
  }

  static getFavoriteItems() {
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    return {
      data: favorites.map((f: Favorite) => {
        const profileMetricLabel = ProfileMetricsDataSource.getProfileMetricLabel(f.profileMetricId);

        return {
          label: `${f.serviceName} · ${profileMetricLabel}`,
          value: `${f.serviceName}-${f.profileMetricId}`,
          color: f.color,
          queryRunnerParams: omit(f, 'color'),
        };
      }),
      isLoading: false,
      error: null,
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
