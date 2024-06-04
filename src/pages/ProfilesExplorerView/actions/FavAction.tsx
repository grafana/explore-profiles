import { css } from '@emotion/css';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import { omit } from 'lodash';
import React from 'react';

import { Favorite, FavoritesDataSource } from '../data/FavoritesDataSource';
import { GridItemData } from '../types/GridItemData';

export interface FavActionState extends SceneObjectState {
  item: GridItemData;
  isFav?: boolean;
}

export class FavAction extends SceneObjectBase<FavActionState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: this.update.bind(this),
  });

  constructor(state: FavActionState) {
    super(state);

    this.addActivationHandler(() => this.update());
  }

  update() {
    this.setState({ isFav: this.isStored() });
  }

  isStored() {
    return FavoritesDataSource.exists(this.interpolateQueryRunnerVariables());
  }

  interpolateQueryRunnerVariables() {
    const { queryRunnerParams } = this.state.item;

    return omit(
      {
        ...queryRunnerParams,
        serviceName:
          queryRunnerParams.serviceName || (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
        profileMetricId:
          queryRunnerParams.profileMetricId ||
          (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
      },
      // we never store group by values because
      // we always refetch the label values so that the timeseries are up-to-date
      // see buildTimeSeriesGroupByQueryRunner()
      'groupBy.values'
    ) as Favorite['queryRunnerParams'];
  }

  public onClick = () => {
    const { isFav, item } = this.state;

    const favorite: Favorite = {
      queryRunnerParams: this.interpolateQueryRunnerVariables(),
      index: item.index,
    };

    console.log('*** onClick', userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.favorites);

    if (!isFav) {
      FavoritesDataSource.addFavorite(favorite);
    } else {
      FavoritesDataSource.removeFavorite(favorite);
    }

    this.setState({ isFav: !isFav });
  };

  public static Component = ({ model }: SceneComponentProps<FavAction>) => {
    const styles = useStyles2(getStyles);
    const { isFav } = model.useState();

    return (
      <IconButton
        className={isFav ? styles.favedButton : styles.notFavedbutton}
        name={isFav ? 'favorite' : 'star'}
        variant="secondary"
        size="sm"
        aria-label={isFav ? 'Unfavorite' : 'Favorite'}
        tooltip={isFav ? 'Unfavorite' : 'Favorite'}
        tooltipPlacement="top"
        onClick={model.onClick}
      />
    );
  };
}

const getStyles = () => ({
  favedButton: css`
    color: #f2cc0d;
    margin: 0;
  `,
  notFavedbutton: css`
    margin: 0;
  `,
});
