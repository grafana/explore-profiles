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
  TABLE = 'table',
  HISTOGRAM = 'histogram',
}

export interface ScenePanelTypeSwitcherState extends SceneObjectState {
  panelType: PanelType;
  onChange?: (panelType: PanelType) => void;
}

export class ScenePanelTypeSwitcher extends SceneObjectBase<ScenePanelTypeSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['panelType'] });

  static OPTIONS = [
    { label: 'Time series', value: PanelType.TIMESERIES, icon: 'heart-rate' },
    { label: 'Totals', value: PanelType.BARGAUGE, icon: 'align-left' },
    { label: 'Maxima', value: PanelType.TABLE, icon: 'angle-double-up' },
    { label: 'Histograms', value: PanelType.HISTOGRAM, icon: 'graph-bar' },
  ];

  static DEFAULT_PANEL_TYPE = PanelType.TIMESERIES;

  constructor() {
    super({
      key: 'panel-type-switcher',
      panelType: ScenePanelTypeSwitcher.DEFAULT_PANEL_TYPE,
    });
  }

  getUrlState() {
    return {
      panelType: this.state.panelType,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<ScenePanelTypeSwitcherState> = {};

    if (typeof values.panelType === 'string' && values.panelType !== this.state.panelType) {
      stateUpdate.panelType = Object.values(PanelType).includes(values.panelType as PanelType)
        ? (values.panelType as PanelType)
        : ScenePanelTypeSwitcher.DEFAULT_PANEL_TYPE;
    }

    this.setState(stateUpdate);
  }

  reset() {
    this.setState({ panelType: ScenePanelTypeSwitcher.DEFAULT_PANEL_TYPE });
  }

  onChange = (panelType: PanelType) => {
    reportInteraction('g_pyroscope_app_panel_type_changed', { panelType });

    this.setState({ panelType });
  };

  static Component = ({ model }: SceneComponentProps<ScenePanelTypeSwitcher>) => {
    const { panelType } = model.useState();

    return (
      <RadioButtonGroup
        aria-label="Panel type switcher"
        options={ScenePanelTypeSwitcher.OPTIONS}
        value={panelType}
        onChange={model.onChange}
        fullWidth={false}
      />
    );
  };
}
