import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, VariableDependencyConfig } from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import React from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { Favorite, FavoritesDataSource } from '../data/favorites/FavoritesDataSource';
import { interpolateQueryRunnerVariables } from '../data/helpers/interpolateQueryRunnerVariables';

export interface FavActionState extends SceneObjectState {
  item: GridItemData;
  isFav?: boolean;
  skipVariablesInterpolation?: boolean;
}

export class FavAction extends SceneObjectBase<FavActionState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId', 'filters'],
    onReferencedVariableValueChanged: () => {
      this.update();
    },
  });

  constructor(state: FavActionState) {
    super(state);

    this.addActivationHandler(() => this.update());
  }

  update() {
    this.setState({ isFav: this.isStored() });
  }

  isStored() {
    return FavoritesDataSource.exists(this.buildFavorite());
  }

  buildFavorite(): Favorite {
    const { item, skipVariablesInterpolation } = this.state;

    const queryRunnerParams = (
      skipVariablesInterpolation ? item.queryRunnerParams : interpolateQueryRunnerVariables(this, item)
    ) as Favorite['queryRunnerParams'];

    if (queryRunnerParams.groupBy) {
      queryRunnerParams.groupBy = {
        label: queryRunnerParams.groupBy.label, // we don't store values, we'll fetch all timeseries by using the `groupBy` parameter
      };
    } else {
      delete queryRunnerParams.groupBy;
    }

    // we don't store filters if empty
    if (!queryRunnerParams.filters?.length) {
      delete queryRunnerParams.filters;
    }

    return {
      index: item.index,
      queryRunnerParams,
    };
  }

  public onClick = () => {
    if (!this.state.isFav) {
      FavoritesDataSource.addFavorite(this.buildFavorite());
    } else {
      FavoritesDataSource.removeFavorite(this.buildFavorite());
    }

    this.setState({ isFav: !this.state.isFav });
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
