import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
} from '@grafana/scenes';
import { RadioButtonGroup } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

export enum LayoutType {
  GRID = 'grid',
  ROWS = 'rows',
}

export interface SceneLayoutSwitcherState extends SceneObjectState {
  layout: LayoutType;
  onChange?: (layout: LayoutType) => void;
}

export class SceneLayoutSwitcher extends SceneObjectBase<SceneLayoutSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['layout'] });

  static OPTIONS = [
    { label: 'Grid', value: LayoutType.GRID },
    { label: 'Rows', value: LayoutType.ROWS },
  ];

  static DEFAULT_LAYOUT = LayoutType.GRID;

  constructor() {
    super({
      key: 'layout-switcher',
      layout: SceneLayoutSwitcher.DEFAULT_LAYOUT,
    });
  }

  getUrlState() {
    return {
      layout: this.state.layout,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneLayoutSwitcherState> = {};

    if (typeof values.layout === 'string' && values.layout !== this.state.layout) {
      stateUpdate.layout = Object.values(LayoutType).includes(values.layout as LayoutType)
        ? (values.layout as LayoutType)
        : SceneLayoutSwitcher.DEFAULT_LAYOUT;
    }

    this.setState(stateUpdate);
  }

  onChange = (layout: LayoutType) => {
    reportInteraction('g_pyroscope_app_layout_changed', { layout });

    this.setState({ layout });
  };

  static Component = ({ model }: SceneComponentProps<SceneLayoutSwitcher>) => {
    const { layout } = model.useState();

    return (
      <RadioButtonGroup
        aria-label="Layout switcher"
        options={SceneLayoutSwitcher.OPTIONS}
        value={layout}
        onChange={model.onChange}
        fullWidth={false}
      />
    );
  };
}
