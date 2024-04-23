import {
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { DrawStyle } from '@grafana/ui';
import React from 'react';

import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { SceneServiceDetailsTabs } from './SceneServiceDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 200;

interface SceneServiceDetailsState extends SceneObjectState {
  serviceName: string;
  color: string;
  body: SceneFlexLayout;
}

export class SceneServiceDetails extends SceneObjectBase<SceneServiceDetailsState> {
  constructor({
    serviceName,
    color,
  }: {
    serviceName: SceneServiceDetailsState['serviceName'];
    color: SceneServiceDetailsState['color'];
  }) {
    super({
      serviceName,
      color,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: PanelBuilders.timeseries()
              .setTitle(serviceName)
              .setOption('legend', { showLegend: false })
              .setData(getServiceQueryRunner({ serviceName }))
              .setColor({ mode: 'fixed', fixedColor: color })
              // .setCustomFieldConfig('fillOpacity', 9)
              .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
              .setCustomFieldConfig('fillOpacity', 100)
              .setCustomFieldConfig('lineWidth', 0)
              .build(),
          }),
          new SceneFlexItem({
            body: new SceneServiceDetailsTabs({
              serviceName,
              activeTabId: 'flame-graph',
            }),
          }),
        ],
      }),
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneServiceDetails>) => {
    const { body } = model.useState();

    return <body.Component model={body} />;
  };
}
