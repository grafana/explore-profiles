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

import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';
import { SceneProfileMetricDetailsTabs } from './SceneProfileMetricDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 200;

interface SceneProfileDetailsState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  color: string;
  body: SceneFlexLayout;
}

export class SceneProfileDetails extends SceneObjectBase<SceneProfileDetailsState> {
  constructor({
    profileMetric,
    color,
  }: {
    profileMetric: SceneProfileDetailsState['profileMetric'];
    color: SceneProfileDetailsState['color'];
  }) {
    super({
      profileMetric,
      color,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: PanelBuilders.timeseries()
              .setTitle(profileMetric.label)
              .setOption('legend', { showLegend: false })
              .setData(getProfileMetricQueryRunner({ profileMetricId: profileMetric.value }))
              .setColor({ mode: 'fixed', fixedColor: color })
              // .setCustomFieldConfig('fillOpacity', 9)
              .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
              .setCustomFieldConfig('fillOpacity', 100)
              .setCustomFieldConfig('lineWidth', 0)
              .build(),
          }),
          new SceneFlexItem({
            body: new SceneProfileMetricDetailsTabs({
              profileMetric,
              activeTabId: 'breakdown',
            }),
          }),
        ],
      }),
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneProfileDetails>) => {
    const { body } = model.useState();

    return <body.Component model={body} />;
  };
}
