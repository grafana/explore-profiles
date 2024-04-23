import { css } from '@emotion/css';
import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneObjectBase,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { FavAction, Favorite } from '../FavAction';
import { getColorByIndex } from '../getColorByIndex';
import { SelectFavoriteAction } from './actions/SelectFavoriteAction';
import { getLabelsQueryRunner } from './data/getLabelsQueryRunner';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

interface SceneFavoritesListState extends EmbeddedSceneState {
  favorites: Favorite[];
  body: SceneCSSGridLayout;
}

export class SceneFavoritesList extends SceneObjectBase<SceneFavoritesListState> {
  constructor({ favorites }: { favorites: SceneFavoritesListState['favorites'] }) {
    super({
      favorites,
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
        children: SceneFavoritesList.buildGridItems(favorites),
      }),
    });
  }

  update({ favorites }: { favorites: SceneFavoritesListState['favorites'] }) {
    this.state.body.setState({
      children: SceneFavoritesList.buildGridItems(favorites),
    });
  }

  static buildGridItems(favorites: SceneFavoritesListState['favorites']) {
    return favorites.map((favorite, i) => {
      const profileMetric = getProfileMetric(favorite.profileMetricId as ProfileMetricId);
      const profileMetricLabel = `${profileMetric.type}`;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(
            !favorite.labelValues
              ? favorite.serviceName
              : `${favorite.serviceName} · ${profileMetricLabel} (${favorite.labelId})`
          )
          .setOption('legend', { showLegend: true })
          .setData(
            !favorite.labelValues
              ? getServiceQueryRunner({
                  profileMetricId: favorite.profileMetricId,
                  serviceName: favorite.serviceName,
                })
              : getLabelsQueryRunner({
                  profileMetricId: favorite.profileMetricId,
                  serviceName: favorite.serviceName,
                  labelId: favorite.labelId,
                  labelValues: favorite.labelValues,
                })
          )
          .setOverrides((overrides) => {
            favorite?.labelValues?.forEach((value, j) => {
              overrides
                .matchFieldsByQuery(`${favorite.profileMetricId}-${favorite.serviceName}-${favorite.labelId}-${value}`)
                .overrideColor({
                  mode: 'fixed',
                  fixedColor: getColorByIndex(i + j),
                })
                .overrideDisplayName(value);
            });
          })
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([new SelectFavoriteAction({ favorite }), new FavAction(favorite)])
          .build(),
      });
    });
  }

  static Component = ({ model }: SceneComponentProps<SceneFavoritesList>) => {
    const styles = useStyles2(getStyles);
    const { body } = model.useState();

    return (
      <div className={styles.body}>
        <body.Component model={body} />
      </div>
    );
  };
}

const getStyles = () => ({
  body: css`
    display: flex;
    flex-direction: column;
    overflow-y: scroll; // does not work :/
  `,
});
