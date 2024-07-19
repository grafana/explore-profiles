import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import React from 'react';

import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';

interface SceneAllLabelValuesTimeseriesState extends SceneObjectState {
  body: VizPanel;
}

export class SceneAllLabelValuesTimeseries extends SceneObjectBase<SceneAllLabelValuesTimeseriesState> {
  constructor({
    item,
    headerActions,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  }) {
    super({
      key: 'timeseries-all-label-values',
      body: PanelBuilders.timeseries()
        .setTitle(item.queryRunnerParams.groupBy?.label || '')
        .setData(buildTimeSeriesQueryRunner(item.queryRunnerParams))
        .setHeaderActions(headerActions(item))
        .setMin(0)
        .setCustomFieldConfig('fillOpacity', 0)
        .build(),
    });
  }

  static Component({ model }: SceneComponentProps<SceneAllLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
