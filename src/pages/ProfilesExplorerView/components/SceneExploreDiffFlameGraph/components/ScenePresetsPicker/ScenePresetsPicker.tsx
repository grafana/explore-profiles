import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Combobox, ComboboxOption, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { CompareTarget } from '../../domain/types';
import { SceneComparePanel } from '../SceneComparePanel/SceneComparePanel';

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

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
}

export class ScenePresetsPicker extends SceneObjectBase<ScenePresetsPickerState> {
  private static OPTIONS: Array<ComboboxOption<string>> = [
    {
      label: 'Last hour',
      value: 'last hour (30m-window)',
      description: '30m window',
    },
    {
      label: '6h ago vs now',
      value: '6h ago vs now',
      description: '1h window',
    },
    {
      label: '24h ago vs now',
      value: '24h ago vs now',
      description: '1h window',
    },
  ];

  private static PRESETS: Record<string, PresetOption> = {
    'last hour (30m-window)': {
      baseline: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now-30m' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-30m', diffTo: 'now' },
    },
    '6h ago vs now': {
      baseline: { from: 'now-6h', to: 'now-5h', diffFrom: 'now-6h', diffTo: 'now-5h' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now' },
    },
    '24h ago vs now': {
      baseline: { from: 'now-24h', to: 'now-23h', diffFrom: 'now-24h', diffTo: 'now-23h' },
      comparison: { from: 'now-1h', to: 'now', diffFrom: 'now-1h', diffTo: 'now' },
    },
  };

  constructor() {
    super({
      name: 'compare-presets',
      label: 'Comparison presets',
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

  static Component({ model }: SceneComponentProps<ScenePresetsPicker>) {
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

const getStyles = () => ({
  presetsContainer: css`
    display: flex;
  `,
});
