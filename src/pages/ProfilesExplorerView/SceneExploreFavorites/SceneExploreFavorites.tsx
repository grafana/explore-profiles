import { EmbeddedSceneState, SceneComponentProps, sceneGraph, SceneObjectBase } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';
import { omit } from 'lodash';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';

interface SceneExploreFavoritesState extends EmbeddedSceneState {}

type Favorite = Record<string, any> & {
  serviceName: string;
  profileMetricId: string;
  color: string;
};

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    const favoritesList = new SceneTimeSeriesGrid({
      key: 'favorites-grid',
      items: SceneExploreFavorites.getFavoriteItems(),
      headerActions: (params) => [
        new SelectAction({ eventClass: 'EventViewDetails', params }),
        new FavAction({ params }),
      ],
    });

    super({
      key: 'explore-favorites',
      body: favoritesList,
    });

    this.addActivationHandler(() => {
      const $timeRange = sceneGraph.getTimeRange(this);
      const originalRefresh = $timeRange.onRefresh;

      // TODO: remove hack - how? favs data source?
      $timeRange.onRefresh = (...args) => {
        originalRefresh(...args);
        favoritesList.updateItems(SceneExploreFavorites.getFavoriteItems());
      };

      return () => {
        $timeRange.onRefresh = originalRefresh;
      };
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
