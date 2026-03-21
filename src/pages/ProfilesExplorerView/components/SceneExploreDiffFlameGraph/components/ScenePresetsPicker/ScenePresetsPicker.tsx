import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Combobox, ComboboxOption, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { CompareTarget } from '../../domain/types';
import { SceneComparePanel } from '../SceneComparePanel/SceneComparePanel';

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
  isSelectOpen: boolean;
  value: string | null;
}

export type Preset = {
  from: string;
  to: string;
  diffFrom: string;
  diffTo: string;
};

export type PresetOption = {
  baseline: Preset;
  comparison: Preset;
};

export class ScenePresetsPicker extends SceneObjectBase<ScenePresetsPickerState> {
  private static OPTIONS: Array<ComboboxOption<string>> = [
    {
      label: 'Last hour',
      value: 'last hour (30m-window)',
      description: '30m window',
    },
    {
      label: 'Last hour',
      value: 'last hour (1h-window)',
      description: '1h window',
    },
    {
      label: '6h ago vs now',
      value: '6h ago vs now',
      description: '30m window',
    },
    {
      label: '24h ago vs now',
      value: '24h ago vs now',
      description: '30m window',
    },
  ];

  private static PRESETS: Record<string, PresetOption> = {
    'last hour (30m-window)': {
      baseline: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now-30m' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-30m', diffTo: 'now' },
    },
    'last hour (1h-window)': {
      baseline: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now' },
    },
    '6h ago vs now': {
      baseline: { from: 'now-375m', to: 'now-315m', diffFrom: 'now-375m', diffTo: 'now-345m' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-30m', diffTo: 'now' },
    },
    '24h ago vs now': {
      baseline: { from: 'now-1455m', to: 'now-1395m', diffFrom: 'now-1455m', diffTo: 'now-1425m' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-30m', diffTo: 'now' },
    },
  };

  constructor() {
    super({
      name: 'compare-presets',
      label: 'Comparison presets',
      value: null,
      isSelectOpen: false,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    [CompareTarget.BASELINE, CompareTarget.COMPARISON].forEach((compareTarget) => {
      this._subs.add(
        sceneGraph
          .findByKeyAndType(this, `${compareTarget}-panel`, SceneComparePanel)
          .state.$timeRange?.subscribeToState((newState, prevState) => {
            if (newState.from !== prevState.from || newState.to !== prevState.to) {
              this.setState({ value: null });
            }
          })
      );
    });
  }

  onChange = (option: ComboboxOption<string>) => {
    reportInteraction('g_pyroscope_app_diff_preset_selected', { value: option.value });

    const presets = ScenePresetsPicker.PRESETS[option.value];
    [CompareTarget.BASELINE, CompareTarget.COMPARISON].forEach((compareTarget) => {
      const panel = sceneGraph.findByKeyAndType(this, `${compareTarget}-panel`, SceneComparePanel);
      panel.applyPreset(presets[compareTarget]);
    });
  };

  static Component({ model }: SceneComponentProps<ScenePresetsPicker & { onChange: any }>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    return (
      <div className={styles.presetsContainer}>
        <Combobox
          placeholder="Select a preset"
          value={null}
          options={ScenePresetsPicker.OPTIONS}
          onChange={model.onChange}
        />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  presetsContainer: css`
    display: flex;
  `,
  select: css`
    min-width: ${theme.spacing(24)};
    text-align: left;
  `,
});
