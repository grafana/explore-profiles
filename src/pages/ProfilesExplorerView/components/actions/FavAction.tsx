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
import React from 'react';

interface FavActionState extends SceneObjectState {
  profileMetricId?: string;
  serviceName?: string;
  labelId: string;
  labelValues?: string[];
  isFav?: boolean;
}

export type Favorite = {
  profileMetricId: string;
  serviceName: string;
  labelId: string;
  labelValues?: string[];
};

export class FavAction extends SceneObjectBase<FavActionState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetric', 'serviceName'],
    onReferencedVariableValueChanged: this.update.bind(this),
  });

  constructor(state: FavActionState) {
    super(state);

    this.addActivationHandler(() => this.update());
  }

  update() {
    this.setState({
      isFav: this.isStored(),
    });
  }

  isStored() {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    const {
      profileMetricId = sceneGraph.lookupVariable('profileMetric', this)?.getValue(),
      serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue(),
      labelId,
    } = this.state;

    return storage.favorites.some(
      (p: Partial<FavActionState>) =>
        p.profileMetricId === profileMetricId && p.serviceName === serviceName && p.labelId === labelId
    );
  }

  public onClick = () => {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.favorites ||= [];

    const {
      profileMetricId = sceneGraph.lookupVariable('profileMetric', this)?.getValue(),
      serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue(),
      labelId,
      labelValues,
      isFav,
    } = this.state;

    if (!isFav) {
      storage.favorites.push({ profileMetricId, serviceName, labelId, labelValues });
    } else {
      storage.favorites = storage.favorites.filter(
        (p: Partial<FavActionState>) =>
          !(p.profileMetricId === profileMetricId && p.serviceName === serviceName && p.labelId === labelId)
      );
    }

    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);

    this.update();
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
