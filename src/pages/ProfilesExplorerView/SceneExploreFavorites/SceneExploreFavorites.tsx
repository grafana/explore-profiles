import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import debounce from 'lodash.debounce';
import React from 'react';

import { LayoutType, SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneExploreFavoritesList } from './SceneExploreFavoritesList';

interface SceneExploreFavoritesState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  noDataSwitcher: SceneNoDataSwitcher;
}

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search favorites' });
    const layoutSwitcher = new SceneLayoutSwitcher();
    const noDataSwitcher = new SceneNoDataSwitcher();
    const favoritesList = new SceneExploreFavoritesList({ layout: LayoutType.GRID });

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
  }

  onFilterChange(searchText: string) {
    (this.state.body as SceneExploreFavoritesList).onFilterChange(searchText);
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneExploreFavoritesList).onLayoutChange(newLayout);
  }

  onHideNoDataChange(newHideNoData: boolean) {
    (this.state.body as SceneExploreFavoritesList).onHideNoDataChange(newHideNoData);
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