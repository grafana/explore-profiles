import {
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  SceneReactObject,
  VizPanelState,
} from '@grafana/scenes';
import React from 'react';

import { EventSelectForCompare } from '../../../../domain/events/EventSelectForCompare';
import { GridItemData } from '../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneLabelValuesTimeseries } from '../../../SceneLabelValuesTimeseries';
import { GRID_AUTO_ROWS, GridItemDataWithStats } from '../SceneLabelValuesGrid';
import { ComparePanel, CompareTarget } from './ui/ComparePanel';

interface SceneLabelValuesStatAndTimeseriesState extends SceneObjectState {
  body: SceneFlexLayout;
}

export const WIDTH_COMPARE_PANEL = '180px';

export class SceneLabelValuesStatAndTimeseries extends SceneObjectBase<SceneLabelValuesStatAndTimeseriesState> {
  static buildComparePanelKey(item: GridItemDataWithStats) {
    return `compare-panel-${item.value}`;
  }

  constructor(options: {
    item: GridItemDataWithStats;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
    compareTargetValue?: CompareTarget;
  }) {
    super({
      key: 'stat-and-timeseries-label-values',
      body: new SceneFlexLayout({
        direction: 'row',
        minHeight: GRID_AUTO_ROWS,
        children: [],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this, options));
  }

  onActivate({
    item,
    headerActions,
    compareTargetValue,
  }: {
    item: GridItemDataWithStats;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
    compareTargetValue?: CompareTarget;
  }) {
    this.state.body.setState({
      minHeight: GRID_AUTO_ROWS,
      children: [
        new SceneFlexItem({
          width: WIDTH_COMPARE_PANEL,
          body: new SceneReactObject({
            key: SceneLabelValuesStatAndTimeseries.buildComparePanelKey(item),
            component: ComparePanel,
            props: {
              item,
              onChangeCompareTarget: (compareTarget: CompareTarget, item: GridItemDataWithStats) => {
                this.publishEvent(new EventSelectForCompare({ compareTarget, item }), true);
              },
              compareTargetValue,
            },
          }),
        }),
        new SceneFlexItem({
          body: new SceneLabelValuesTimeseries({ item, headerActions }),
        }),
      ],
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesStatAndTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
