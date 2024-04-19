import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from '../SceneBreakdownTab';

export interface SelectLabelActionState extends SceneObjectState {
  labelId: string;
}

export class SelectLabelAction extends SceneObjectBase<SelectLabelActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, SceneBreakdownTab).selectLabel(this.state.labelId);
  };

  public static Component = ({ model }: SceneComponentProps<SelectLabelAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
