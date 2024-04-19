import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { IconButton, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

interface FavActionState extends SceneObjectState {
  key: string;
  value: string;
  isFav?: boolean;
}

export class FavAction extends SceneObjectBase<FavActionState> {
  isFav: FavActionState['isFav'];

  constructor(state: FavActionState) {
    super(state);

    const { key, value } = state;

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage[key] = storage[key] || [];

    this.setState({ isFav: storage[key].includes(value) });
  }

  public onClick = () => {
    const { key, value } = this.state;

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage[key] = storage[key] || [];

    const set = new Set(storage[key]);

    if (!set.has(value)) {
      set.add(value);
      this.setState({ isFav: true });
    } else {
      set.delete(value);
      this.setState({ isFav: false });
    }

    storage[key] = Array.from(set);

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
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
