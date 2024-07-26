import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import React from 'react';

import { getColorByIndex } from '../helpers/getColorByIndex';
import { buildTimeSeriesQueryRunner } from '../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneLabelValueStatState extends SceneObjectState {
  body: VizPanel;
}

export class SceneLabelValueStat extends SceneObjectBase<SceneLabelValueStatState> {
  constructor({
    item,
    headerActions,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  }) {
    super({
      key: 'stat-label-value',
      body: PanelBuilders.stat()
        .setTitle(item.label)
        .setDescription('This panel displays aggregate values over the current time period')
        .setData(buildTimeSeriesQueryRunner(item.queryRunnerParams))
        .setHeaderActions(headerActions(item))
        .setColor({ mode: 'fixed', fixedColor: getColorByIndex(item.index) })
        .setOption('reduceOptions', { values: false, calcs: ['sum'] })
        .build(),
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValueStat>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
