import { DashboardCursorSync, LoadingState } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

import { FavAction, FavActionState } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { EmptyStateScene } from '../components/EmptyState/EmptyStateScene';
import { LayoutType } from '../components/SceneLayoutSwitcher';
import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';

interface SceneExploreFavoritesListState extends EmbeddedSceneState {
  favorites: Array<FavActionState['params']>;
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneExploreFavoritesList extends SceneObjectBase<SceneExploreFavoritesListState> {
  constructor({ layout }: { layout: LayoutType }) {
    const favorites = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites || [];

    super({
      key: 'favorites-list',
      favorites,
      hideNoData: false,
      body: new SceneCSSGridLayout({
        templateColumns: layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [],
      }),
    });

    this.addActivationHandler(() => {
      this.updateGridItems(this.state.favorites);
    });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateGridItems(favorites: SceneExploreFavoritesListState['favorites']) {
    if (!favorites.length) {
      (this.state.body as SceneCSSGridLayout).setState({
        autoRows: '480px',
        children: [
          new SceneCSSGridItem({
            body: new EmptyStateScene({
              message: 'No favorites found',
            }),
          }),
        ],
      });

      return;
    }

    const gridItems = favorites.map((params) => {
      const { serviceName, profileMetricId, color } = params;
      const gridItemKey = `grid-item-${serviceName}`;

      const data = buildProfileQueryRunner({ serviceName, profileMetricId });

      if (this.state.hideNoData) {
        this._subs.add(
          data.subscribeToState((state) => {
            if (state.data?.state === LoadingState.Done && !state.data.series.length) {
              const gridItem = sceneGraph.getAncestor(data, SceneCSSGridItem);
              const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);
              const { children } = grid.state;

              grid.setState({
                children: children.filter((c) => c.state.key !== gridItemKey),
              });
            }
          })
        );
      }

      const profileMetric = getProfileMetric(profileMetricId as ProfileMetricId);
      const profileMetricLabel = `${profileMetric.type} (${profileMetric.group})`;

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: PanelBuilders.timeseries()
          .setTitle(`${serviceName} · ${profileMetricLabel}`)
          .setOption('legend', { showLegend: true }) // show profile metric ("cpu", etc.)
          .setData(data)
          .setColor({ mode: 'fixed', fixedColor: color })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([new SelectAction({ params }), new FavAction({ params })])
          .build(),
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS,
      children: gridItems,
    });
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneCSSGridLayout).setState({
      templateColumns: newLayout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  onFilterChange(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const favorites = trimmedSearchText
      ? this.state.favorites.filter(
          ({ serviceName, profileMetricId }) =>
            serviceName.includes(trimmedSearchText) || profileMetricId.includes(trimmedSearchText)
        )
      : this.state.favorites;

    this.updateGridItems(favorites);
  }

  onHideNoDataChange(newHideNoData: boolean) {
    this.setState({
      hideNoData: newHideNoData,
    });

    this.updateGridItems(this.state.favorites);
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavoritesList>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
