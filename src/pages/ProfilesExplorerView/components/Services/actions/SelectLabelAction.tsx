import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { ServicesExplorer } from '../ServicesExplorer';

export interface SelectLabelActionState extends SceneObjectState {
  serviceName: string;
  labelId: string;
  labelValues: string[];
}

export class SelectLabelAction extends SceneObjectBase<SelectLabelActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, ServicesExplorer).selectLabel(this.state);
  };

  public static Component = ({ model }: SceneComponentProps<SelectLabelAction>) => {
    return (
      <Button variant="secondary" size="sm" fill="solid" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
