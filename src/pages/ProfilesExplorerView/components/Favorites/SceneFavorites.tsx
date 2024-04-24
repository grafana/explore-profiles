import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneFlexItem,
  SceneObject,
  SceneObjectBase,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  SplitLayout,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Icon, IconButton, Input, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import debounce from 'lodash.debounce';
import React from 'react';

import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { Favorite } from '../FavAction';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import { SceneFavoritesList } from './SceneFavoritesList';

interface SceneFavoritesState extends EmbeddedSceneState {
  favorites: Favorite[];
  body: SplitLayout;
}

export class SceneFavorites extends SceneObjectBase<SceneFavoritesState> {
  constructor(timeRange: TimeRange) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const favorites = storage.favorites || [];

    const dataSource = new ProfilesDataSourceVariable({});

    super({
      favorites,
      $timeRange: new SceneTimeRange({ value: timeRange }),
      $variables: new SceneVariableSet({
        variables: [dataSource],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
      body: SceneFavorites.buildBody(
        favorites.length
          ? new SceneFavoritesList({
              favorites,
            })
          : new EmptyStateScene({
              message: 'No favorites',
            })
      ),
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
  }

  static buildBody(body: SceneObject) {
    return new SplitLayout({
      direction: 'column',
      // initialSize: 0.6,
      primary: new SceneFlexItem({ body }),
    });
  }

  clearSearch() {
    (document.querySelector('#search-favorites-input') as HTMLInputElement).value = '';

    if (!this.state.favorites.length) {
      this.setState({
        body: SceneFavorites.buildBody(
          new EmptyStateScene({
            message: 'No favorites',
          })
        ),
      });
      return;
    }

    this.onFilterChange('');
  }

  onFilterChange(searchText: string) {
    const favorites = this.filterFavorites(searchText);

    if (!favorites.length) {
      this.setState({
        body: SceneFavorites.buildBody(
          new EmptyStateScene({
            message: 'No favorites found',
          })
        ),
      });
      return;
    }

    const primaryBody = (this.state.body.state.primary as SceneFlexItem).state.body;

    if (primaryBody instanceof SceneFavoritesList) {
      primaryBody.update({ favorites });
      return;
    }

    this.setState({
      body: SceneFavorites.buildBody(
        new SceneFavoritesList({
          favorites,
        })
      ),
    });
  }

  filterFavorites(searchText: string) {
    const { favorites } = this.state;
    return searchText ? favorites.filter(({ serviceName }) => serviceName.includes(searchText)) : favorites;
  }

  selectFavorite(favorite: Favorite, color: string) {
    console.log('*** selectFavorite', favorite, color);
  }

  static Component = ({ model }: SceneComponentProps<SceneFavorites>) => {
    const styles = useStyles2(getStyles);
    const { controls, body, favorites } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.variablesControl}>
            <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
            <div className={styles.filter}>
              <Input
                id="search-favorites-input"
                type="text"
                placeholder="Search favorites by service name"
                prefix={<Icon name="filter" />}
                suffix={
                  <IconButton
                    name="times"
                    aria-label="Clear search"
                    disabled={!favorites.length}
                    onClick={() => model.clearSearch()}
                  />
                }
                onChange={(e: any) => model.onFilterChange(e.target.value.trim())}
                disabled={!favorites.length}
              />
            </div>
          </div>
          <div className={styles.timeControls}>
            <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
            <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
          </div>
        </div>
        <div className={styles.body}>
          <body.Component model={body} />
        </div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    gap: ${theme.spacing(2)};
    min-height: 100%;
    flex-direction: column;
    padding: ${theme.spacing(2)};
  `,
  controls: css`
    display: flex;
    gap: ${theme.spacing(2)};
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
  `,
  variablesControl: css`
    display: flex;
    gap: ${theme.spacing(1)};
    flex-grow: 1;
  `,
  filter: css`
    flex-grow: 1;
  `,
  timeControls: css`
    display: flex;
  `,
  body: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
});
