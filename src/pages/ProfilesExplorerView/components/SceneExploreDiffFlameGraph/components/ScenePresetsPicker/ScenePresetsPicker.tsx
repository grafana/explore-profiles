import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState, SceneTimeRange } from '@grafana/scenes';
import { Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { buildTimeRange } from '../../../../domain/buildTimeRange';

interface ScenePresetsPickerState extends SceneObjectState {
  name: string;
  label: string;
}

export class ScenePresetsPicker extends SceneObjectBase<ScenePresetsPickerState> {
  static PRESETS = [
    {
      value: '1h ago vs now',
      label: '1h ago vs now',
      baselineFrom: 'now-1h',
      baselineTo: 'now',
      comparisonFrom: 'now-1h',
    },
    {
      value: '6h ago vs now',
      label: '6h ago vs now',
      baselineFrom: 'now-6h',
      baselineTo: 'now-5h',
      comparisonFrom: 'now-1h',
    },
    {
      value: '24h ago vs now',
      label: '24h ago vs now',
      baselineFrom: 'now-24h',
      baselineTo: 'now-23h',
      comparisonFrom: 'now-1h',
    },
    {
      value: '1 week ago vs now',
      label: '1 week ago vs now',
      baselineFrom: 'now-7d',
      baselineTo: 'now-6d',
      comparisonFrom: 'now-1d',
    },
  ];

  constructor() {
    super({
      name: 'presets',
      label: 'Presets',
    });
  }

  onChange = (preset: SelectableValue<string>) => {
    console.log('*** preset', preset);
    sceneGraph
      .findByKeyAndType(this, 'baseline-panel-timerange', SceneTimeRange)
      .setState(buildTimeRange(preset.baselineFrom, preset.baselineTo));

    sceneGraph
      .findByKeyAndType(this, 'comparison-panel-timerange', SceneTimeRange)
      .setState(buildTimeRange(preset.comparisonFrom, 'now'));
  };

  static Component({ model }: SceneComponentProps<ScenePresetsPicker & { onChange: any }>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    console.log('*** model', model);

    return (
      <Select
        className={styles.select}
        placeholder="Choose a preset"
        options={ScenePresetsPicker.PRESETS}
        onChange={model.onChange}
      />
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  select: css`
    ${theme.spacing(1)}
  `,
});
