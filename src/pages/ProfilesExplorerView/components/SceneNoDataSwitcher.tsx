import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { InlineSwitch, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

interface SceneNoDataSwitcherState extends SceneObjectState {
  hideNoData: boolean;
  onChange?: (hideNoData: boolean) => void;
}

export class SceneNoDataSwitcher extends SceneObjectBase<SceneNoDataSwitcherState> {
  static DEFAULT_VALUE = false;

  constructor() {
    const hideNoData =
      userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.hideNoData || SceneNoDataSwitcher.DEFAULT_VALUE;

    super({ hideNoData });

    this.addActivationHandler(() => {
      this.onChange(hideNoData);
    });
  }

  onChange = (newHideNoData: boolean) => {
    this.setState({ hideNoData: newHideNoData });

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.hideNoData = newHideNoData;
    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);

    this.state.onChange?.(newHideNoData);
  };

  addHandler(handler: SceneNoDataSwitcherState['onChange']) {
    this.setState({ onChange: handler });
  }

  static Component = ({ model }: SceneComponentProps<SceneNoDataSwitcher>) => {
    const styles = useStyles2(getStyles);
    const { hideNoData } = model.useState();

    return (
      <div className={styles.switcher}>
        <InlineSwitch
          label="Hide panels without data"
          showLabel={true}
          value={hideNoData}
          onChange={(event: any) => model.onChange(event.target.checked)}
        />
      </div>
    );
  };
}

const getStyles = () => ({
  switcher: css``,
});
