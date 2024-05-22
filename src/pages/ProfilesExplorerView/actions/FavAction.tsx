import { css } from '@emotion/css';
import { shallowCompare } from '@grafana/data';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

export interface FavActionState extends SceneObjectState {
  params: Record<string, string>;
  isFav?: boolean;
}

const omitColor = (params: FavActionState['params']) => {
  const { color, ...paramsWithoutColor } = params; // eslint-disable-line no-unused-vars
  return paramsWithoutColor;
};

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
    const paramsForCompare = omitColor(this.state.params);

    ['serviceName', 'profileMetricId'].forEach((key) => {
      const value = sceneGraph.lookupVariable(key, this)?.getValue();
      if (typeof value === 'string') {
        paramsForCompare[key] = value;
      }
    });

    return userStorage
      .get(userStorage.KEYS.PROFILES_EXPLORER)
      ?.favorites?.some((p: FavActionState['params']) => shallowCompare(omitColor(p), paramsForCompare));
  }

  public onClick = () => {
    const { isFav, params } = this.state;

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    if (!isFav) {
      storage.favorites.push(params);
    } else {
      const paramsForCompare = omitColor(this.state.params);

      storage.favorites = storage.favorites.filter(
        (p: FavActionState['params']) => !shallowCompare(omitColor(p), paramsForCompare)
      );
    }

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);

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
