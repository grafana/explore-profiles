import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import debounce from 'lodash.debounce';
import React from 'react';

import { LayoutType, SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneServicesList } from '../SceneExploreServices/SceneServicesList';

interface SceneExploreFavoritesState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
}

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search favorites' });
    const layoutSwitcher = new SceneLayoutSwitcher({ layout: LayoutType.GRID });
    // const favoritesList = new SceneExploreFavoritesList({ layout: LayoutType.GRID });

    super({
      key: 'explore-favorites',
      quickFilter,
      layoutSwitcher,
      //   favoritesList,
      //   body: favoritesList,
      // TEMP
      body: new SceneServicesList({ layout: LayoutType.GRID }),
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
    this.onLayoutChange = this.onLayoutChange.bind(this);

    quickFilter.addHandler(this.onFilterChange);
    layoutSwitcher.addHandler(this.onLayoutChange);
  }

  onFilterChange(searchText: string) {
    console.log('*** onFilterChange', searchText);
    // (this.state.body as SceneExploreFavoritesList).onFilterChange(searchText);
  }

  onLayoutChange(newLayout: LayoutType) {
    console.log('*** onLayoutChange', newLayout);
    // (this.state.body as SceneExploreFavoritesList).onLayoutChange(newLayout);
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, quickFilter, layoutSwitcher } = model.useState();

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
          </Stack>
        </div>

        {/* <body.Component model={body} /> */}
        {body && <body.Component model={body} />}
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
