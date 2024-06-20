import { css } from '@emotion/css';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import { clone, defaults, omit, uniqBy } from 'lodash';
import React from 'react';

import { GridItemData } from '../components/SceneTimeSeriesGrid/GridItemData';
import { Favorite, FavoritesDataSource } from '../data/favorites/FavoritesDataSource';
import { parseVariableValue } from '../variables/FiltersVariable/filters-ops';

export interface FavActionState extends SceneObjectState {
  item: GridItemData;
  isFav?: boolean;
}

export class FavAction extends SceneObjectBase<FavActionState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId', 'filters'],
    onReferencedVariableValueChanged: () => {
      const notReady = sceneGraph.hasVariableDependencyInLoadingState(this);
      if (notReady) {
        return;
      }

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
    return FavoritesDataSource.exists(this.interpolateQueryRunnerVariables());
  }

  interpolateQueryRunnerVariables() {
    const { queryRunnerParams } = this.state.item;

    const interpolatedParams: Favorite['queryRunnerParams'] = defaults(omit(clone(queryRunnerParams), 'groupBy'), {
      serviceName: sceneGraph.lookupVariable('serviceName', this)?.getValue(),
      profileMetricId: sceneGraph.lookupVariable('profileMetricId', this)?.getValue(),
    });

    const groupByLabel = queryRunnerParams.groupBy?.label;
    if (groupByLabel) {
      interpolatedParams.groupBy = {
        // we never store groupBy values because
        // we always refetch the label values so that the timeseries are up-to-date
        // see buildTimeSeriesGroupByQueryRunner()
        label: groupByLabel,
      };
    }

    const filtersVariableValue = sceneGraph.lookupVariable('filters', this)?.getValue() as string;
    const parsedFilters = parseVariableValue(filtersVariableValue);

    if (interpolatedParams.filters?.length || parsedFilters.length) {
      interpolatedParams.filters = uniqBy(
        [...(interpolatedParams.filters || []), ...parsedFilters],
        ({ key, operator, value }) => `${key}${operator}${value}`
      );
    }

    return interpolatedParams;
  }

  public onClick = () => {
    const { isFav, item } = this.state;

    const favorite: Favorite = {
      queryRunnerParams: this.interpolateQueryRunnerVariables(),
      index: item.index,
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
