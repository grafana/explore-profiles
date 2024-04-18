import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { ServicesExplorer } from '../ServicesExplorer';

export interface SelectServiceActionState extends SceneObjectState {
  serviceName: string;
}

export class SelectServiceAction extends SceneObjectBase<SelectServiceActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, ServicesExplorer).selectService(this.state);
  };

  public static Component = ({ model }: SceneComponentProps<SelectServiceAction>) => {
    return (
      <Button variant="secondary" size="sm" fill="solid" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
