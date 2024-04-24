import { PanelBuilders, SceneComponentProps, SceneObjectBase, SceneObjectState, VizPanel } from '@grafana/scenes';
import React from 'react';

import { getProfileMetricFlameGraphQueryRunner } from './data/getProfileMetricFlameGraphQueryRunner';

interface SceneFlameGraphState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  body: VizPanel;
}

export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  constructor({ profileMetric }: { profileMetric: SceneFlameGraphState['profileMetric'] }) {
    super({
      profileMetric,
      body: PanelBuilders.flamegraph()
        .setData(getProfileMetricFlameGraphQueryRunner({ profileMetricId: profileMetric.value }))
        .build(),
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const { body } = model.useState();
    return <body.Component model={body} />;
  };
}
