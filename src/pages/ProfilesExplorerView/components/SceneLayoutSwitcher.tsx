import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

export enum LayoutType {
  GRID = 'grid',
  ROWS = 'rows',
}

interface SceneLayoutSwitcherState extends SceneObjectState {
  layout: LayoutType;
  onChange?: (newLayout: LayoutType) => void;
}

export class SceneLayoutSwitcher extends SceneObjectBase<SceneLayoutSwitcherState> {
  static OPTIONS = [
    { label: 'Grid', value: LayoutType.GRID },
    { label: 'Rows', value: LayoutType.ROWS },
  ];

  static DEFAULT_LAYOUT = LayoutType.GRID;

  constructor() {
    const layout = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.layout || SceneLayoutSwitcher.DEFAULT_LAYOUT;

    super({ layout });

    this.addActivationHandler(() => {
      this.onChange(layout);
    });
  }

  onChange = (newLayout: LayoutType) => {
    this.setState({ layout: newLayout });

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.layout = newLayout;
    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);

    this.state.onChange?.(newLayout);
  };

  addHandler(handler: SceneLayoutSwitcherState['onChange']) {
    this.setState({ onChange: handler });
  }

  static Component = ({ model }: SceneComponentProps<SceneLayoutSwitcher>) => {
    const styles = useStyles2(getStyles);
    const { layout } = model.useState();

    return (
      <div className={styles.switcher}>
        <RadioButtonGroup
          options={SceneLayoutSwitcher.OPTIONS}
          value={layout}
          onChange={model.onChange}
          fullWidth={false}
        />
      </div>
    );
  };
}

const getStyles = () => ({
  switcher: css``,
});
