import { css } from '@emotion/css';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavoritesDataSource } from '../data/FavoritesDataSource';

export interface FavActionState extends SceneObjectState {
  params: Record<string, any>;
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
    const { params } = this.state;

    const favoriteForCompare = {
      ...params,
      serviceName: params.serviceName
        ? params.serviceName
        : (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
      profileMetricId: params.profileMetricId
        ? params.profileMetricId
        : (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
    };

    return FavoritesDataSource.exists(favoriteForCompare);
  }

  public onClick = () => {
    const { isFav, params } = this.state;

    const favorite = {
      ...params,
      serviceName: params.serviceName || (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
      profileMetricId:
        params.profileMetricId || (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
    };

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
