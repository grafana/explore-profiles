import { SelectableValue } from '@grafana/data';
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
  SINGLE = 'single',
  GRID = 'grid',
  ROWS = 'rows',
}

interface SceneLayoutSwitcherState extends SceneObjectState {
  layout: LayoutType;
  options: Array<SelectableValue<LayoutType>>;
}

export class SceneLayoutSwitcher extends SceneObjectBase<SceneLayoutSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['layout'] });

  static DEFAULT_OPTIONS = [
    { label: 'Grid', value: LayoutType.GRID },
    { label: 'Rows', value: LayoutType.ROWS },
  ];

  static GROUP_BY_OPTIONS = [
    { label: 'Single', value: LayoutType.SINGLE },
    SceneLayoutSwitcher.DEFAULT_OPTIONS[0],
    SceneLayoutSwitcher.DEFAULT_OPTIONS[1],
  ];

  static DEFAULT_LAYOUT = LayoutType.GRID;

  constructor() {
    super({
      key: 'layout-switcher',
      options: SceneLayoutSwitcher.DEFAULT_OPTIONS,
      layout: SceneLayoutSwitcher.DEFAULT_LAYOUT,
    });
  }

  getUrlState() {
    return {
      layout: this.state.layout,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: SceneLayoutSwitcherState = {
      options: this.state.options,
      layout: SceneLayoutSwitcher.DEFAULT_LAYOUT,
    };

    // hack to allow "Single" to be automatically selected when landing on "Labels" with a preselected groupBy label value
    const searchParams = new URLSearchParams(window.location.search);
    if (
      values.layout === LayoutType.SINGLE &&
      searchParams.get('explorationType') === 'labels' &&
      searchParams.get('var-groupBy') !== 'all'
    ) {
      stateUpdate.options = SceneLayoutSwitcher.GROUP_BY_OPTIONS;
    }

    if (typeof values.layout === 'string' && values.layout !== this.state.layout) {
      stateUpdate.layout = stateUpdate.options.some(({ value }) => value === (values.layout as LayoutType))
        ? (values.layout as LayoutType)
        : SceneLayoutSwitcher.DEFAULT_LAYOUT;
    }

    this.setState(stateUpdate);
  }

  toggleOptions(optionsType: 'default' | 'groupBy') {
    const newOptions =
      optionsType === 'groupBy' ? SceneLayoutSwitcher.GROUP_BY_OPTIONS : SceneLayoutSwitcher.DEFAULT_OPTIONS;

    const { layout } = this.state;
    const newLayout = newOptions.some(({ value }) => value === layout) ? layout : SceneLayoutSwitcher.DEFAULT_LAYOUT;

    this.setState({ options: newOptions, layout: newLayout });
  }

  onChange = (layout: LayoutType) => {
    reportInteraction('g_pyroscope_app_layout_changed', { layout });

    this.setState({ layout });
  };

  static Component = ({ model }: SceneComponentProps<SceneLayoutSwitcher>) => {
    const { layout, options } = model.useState();

    return <RadioButtonGroup options={options} value={layout} onChange={model.onChange} fullWidth={false} />;
  };
}
