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

export enum PanelType {
  TIMESERIES = 'time-series',
  BARGAUGE = 'bar-gauge',
}

interface ScenePanelTypeSwitcherState extends SceneObjectState {
  type: PanelType;
  onChange?: (type: PanelType) => void;
}

export class ScenePanelTypeSwitcher extends SceneObjectBase<ScenePanelTypeSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['type'] });

  static OPTIONS = [
    { label: 'Time series', value: PanelType.TIMESERIES, icon: 'heart-rate' },
    { label: 'Bar gauge', value: PanelType.BARGAUGE, icon: 'graph-bar' },
  ];

  static DEFAULT_TYPE = PanelType.TIMESERIES;

  constructor() {
    super({
      key: 'panel-type-switcher',
      type: ScenePanelTypeSwitcher.DEFAULT_TYPE,
    });
  }

  getUrlState() {
    return {
      type: this.state.type,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<ScenePanelTypeSwitcherState> = {};

    if (typeof values.type === 'string' && values.type !== this.state.type) {
      stateUpdate.type = Object.values(PanelType).includes(values.type as PanelType)
        ? (values.type as PanelType)
        : ScenePanelTypeSwitcher.DEFAULT_TYPE;
    }

    this.setState(stateUpdate);
  }

  onChange = (type: PanelType) => {
    reportInteraction('g_pyroscope_app_panel_type_changed', { type });

    this.setState({ type });
  };

  static Component = ({ model }: SceneComponentProps<ScenePanelTypeSwitcher>) => {
    const { type } = model.useState();

    return (
      <RadioButtonGroup
        options={ScenePanelTypeSwitcher.OPTIONS}
        value={type}
        onChange={model.onChange}
        fullWidth={false}
      />
    );
  };
}
