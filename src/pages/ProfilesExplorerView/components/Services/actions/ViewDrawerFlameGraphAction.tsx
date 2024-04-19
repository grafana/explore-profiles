import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from '../SceneBreakdownTab';

interface ViewDrawerFlameGraphActionState extends SceneObjectState {
  labelId: string;
  labelValue: string;
  isDiff?: boolean;
}

export class ViewDrawerFlameGraphAction extends SceneObjectBase<ViewDrawerFlameGraphActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, SceneBreakdownTab).openFlameGraph(this.state.labelId, this.state.labelValue);
  };

  public static Component = ({ model }: SceneComponentProps<ViewDrawerFlameGraphAction>) => {
    // const { isDiff } = model.useState();
    // const label = isDiff ? 'View diff' : 'View flame graph';

    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        ✨
      </Button>
    );
  };
}
