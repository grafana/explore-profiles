import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { EmbeddedSceneState, SceneComponentProps, sceneGraph, SceneObjectBase } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { userStorage } from '@shared/infrastructure/userStorage';
import { debounce, omit } from 'lodash';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { LayoutType, SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';

interface SceneExploreFavoritesState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  noDataSwitcher: SceneNoDataSwitcher;
}

type Favorite = Record<string, any> & {
  serviceName: string;
  profileMetricId: string;
  color: string;
};

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search favorites' });
    const layoutSwitcher = new SceneLayoutSwitcher();
    const noDataSwitcher = new SceneNoDataSwitcher();

    const favoritesList = new SceneTimeSeriesGrid({
      key: 'favorites-grid',
      items: SceneExploreFavorites.getFavoriteItems(),
      headerActions: (params) => [
        new SelectAction({ label: 'Select', params, eventClass: 'EventSelect' }),
        new FavAction({ params }),
      ],
    });

    super({
      key: 'explore-favorites',
      quickFilter,
      layoutSwitcher,
      noDataSwitcher,
      body: favoritesList,
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onHideNoDataChange = this.onHideNoDataChange.bind(this);

    quickFilter.addHandler(this.onFilterChange);
    layoutSwitcher.addHandler(this.onLayoutChange);
    noDataSwitcher.addHandler(this.onHideNoDataChange);

    this.addActivationHandler(() => {
      const $timeRange = sceneGraph.getTimeRange(this);
      const originalRefresh = $timeRange.onRefresh;

      // TODO: remove hack - how?
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
        const profileMetric = getProfileMetric(f.profileMetricId as ProfileMetricId);
        const profileMetricLabel = `${profileMetric.type} (${profileMetric.group})`;

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

  onFilterChange(searchText: string) {
    (this.state.body as SceneTimeSeriesGrid).onFilterChange(searchText);
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneTimeSeriesGrid).onLayoutChange(newLayout);
  }

  onHideNoDataChange(newHideNoData: boolean) {
    (this.state.body as SceneTimeSeriesGrid).onHideNoDataChange(newHideNoData);
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, quickFilter, layoutSwitcher, noDataSwitcher } = model.useState();

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <Stack justifyContent="space-between">
            <div className={styles.quickFilter}>
              <quickFilter.Component model={quickFilter} />
            </div>
            <div>
              <layoutSwitcher.Component model={layoutSwitcher} />
            </div>
            <div>
              <noDataSwitcher.Component model={noDataSwitcher} />
            </div>
          </Stack>
        </div>

        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    margin-top: ${theme.spacing(1)};
  `,
  controls: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  quickFilter: css`
    width: 100%;
  `,
});
