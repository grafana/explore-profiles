import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

interface SceneLayoutSwitcherState extends SceneObjectState {
  layoutId: string;
  onSwitch: (newLayoutId: string) => void;
}

export class SceneLayoutSwitcher extends SceneObjectBase<SceneLayoutSwitcherState> {
  static options = [
    { label: 'Grid', value: 'grid' },
    { label: 'Rows', value: 'rows' },
  ];

  public onChange = (newLayoutId: string) => {
    this.setState({
      layoutId: newLayoutId,
    });

    this.state.onSwitch(newLayoutId);

    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    storage.breakdownLayout = newLayoutId;
    userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
  };

  public static Component = ({ model }: SceneComponentProps<SceneLayoutSwitcher>) => {
    const styles = useStyles2(getStyles);
    const { layoutId } = model.useState();

    return (
      <div className={styles.selectorWrapper}>
        <h6>Layout</h6>
        <RadioButtonGroup
          options={SceneLayoutSwitcher.options}
          value={layoutId}
          onChange={model.onChange}
          fullWidth={false}
        />
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  selectorWrapper: css`
    margin-bottom: ${theme.spacing(2)};
    text-align: right;
  `,
});
