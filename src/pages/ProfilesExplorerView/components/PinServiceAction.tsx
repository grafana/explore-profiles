import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { IconButton } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

export interface PinServiceActionState extends SceneObjectState {
  key: string;
  value: string;
  isFav?: boolean;
}

export class PinServiceAction extends SceneObjectBase<PinServiceActionState> {
  isFav: PinServiceActionState['isFav'];

  constructor(state: PinServiceActionState) {
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

  public static Component = ({ model }: SceneComponentProps<PinServiceAction>) => {
    const { isFav } = model.useState();

    return (
      <IconButton
        name="favorite"
        aria-label="Set as favorite"
        tooltip="Set as favorite"
        tooltipPlacement="top"
        variant={isFav ? 'primary' : 'secondary'}
        size="sm"
        onClick={model.onClick}
      />
    );
  };
}
