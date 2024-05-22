import { css } from '@emotion/css';
import { shallowCompare } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

interface FavActionState extends SceneObjectState {
  params: Record<string, string>;
  isFav?: boolean;
}

const omitColor = (params: FavActionState['params']) => {
  const { color, ...paramsWithoutColor } = params; // eslint-disable-line no-unused-vars
  return paramsWithoutColor;
};

export class FavAction extends SceneObjectBase<FavActionState> {
  constructor(state: FavActionState) {
    super(state);

    this.addActivationHandler(() => {
      if (this.isStored()) {
        this.setState({ isFav: true });
      }
    });
  }

  isStored() {
    const paramsWithoutColor = omitColor(this.state.params);

    return userStorage
      .get(userStorage.KEYS.PROFILES_EXPLORER)
      ?.favorites?.some((p: FavActionState['params']) => shallowCompare(omitColor(p), paramsWithoutColor));
  }

  public onClick = () => {
    const { isFav, params } = this.state;

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    if (!isFav) {
      storage.favorites.push(params);
    } else {
      const paramsWithoutColor = omitColor(this.state.params);

      storage.favorites = storage.favorites.filter(
        (p: FavActionState['params']) => !shallowCompare(omitColor(p), paramsWithoutColor)
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
