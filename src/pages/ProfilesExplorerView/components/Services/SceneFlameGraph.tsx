import { PanelBuilders, SceneComponentProps, SceneObjectBase, SceneObjectState, VizPanel } from '@grafana/scenes';
import React from 'react';

import { ViewAiAnalysisAction } from './actions/ViewAiAnalysisAction';
import { getServiceFlameGraphQueryRunner } from './data/getServiceFlameGraphQueryRunner';

interface SceneFlameGraphState extends SceneObjectState {
  serviceName: string;
  body: VizPanel;
}

export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  constructor({ serviceName }: { serviceName: SceneFlameGraphState['serviceName'] }) {
    super({
      serviceName,
      body: PanelBuilders.flamegraph()
        .setData(getServiceFlameGraphQueryRunner({ serviceName }))
        .setHeaderActions(new ViewAiAnalysisAction({}))
        .build(),
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const { body } = model.useState();
    return <body.Component model={body} />;
  };
}
