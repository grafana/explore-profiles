import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
} from '@grafana/scenes';
import { InlineSwitch } from '@grafana/ui';
import React from 'react';

export interface SceneNoDataSwitcherState extends SceneObjectState {
  hideNoData: string;
  onChange?: (hideNoData: string) => void;
}

export class SceneNoDataSwitcher extends SceneObjectBase<SceneNoDataSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['hideNoData'] });

  static DEFAULT_VALUE = 'off';

  constructor() {
    super({
      key: 'no-data-switcher',
      hideNoData: SceneNoDataSwitcher.DEFAULT_VALUE,
    });
  }

  getUrlState() {
    return {
      hideNoData: this.state.hideNoData,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneNoDataSwitcherState> = {};

    if (typeof values.hideNoData === 'string' && values.hideNoData !== this.state.hideNoData) {
      stateUpdate.hideNoData = ['on', 'off'].includes(values.hideNoData)
        ? values.hideNoData
        : SceneNoDataSwitcher.DEFAULT_VALUE;
    }

    this.setState(stateUpdate);
  }

  onChange = (hideNoData: string) => {
    this.setState({ hideNoData });
  };

  static Component = ({ model }: SceneComponentProps<SceneNoDataSwitcher>) => {
    const { hideNoData } = model.useState();

    return (
      <InlineSwitch
        showLabel
        label="Hide panels without data"
        value={hideNoData === 'on'}
        onChange={(event: any) => model.onChange(event.target.checked ? 'on' : 'off')}
      />
    );
  };
}
