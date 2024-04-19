import { FieldColor } from '@grafana/data';
import {
  SceneComponentProps,
  SceneCSSGridItem,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneServices } from '../SceneServices';

interface SelectServiceActionState extends SceneObjectState {
  serviceName: string;
}

export class SelectServiceAction extends SceneObjectBase<SelectServiceActionState> {
  public onClick = () => {
    // TODO: use a key on the panel and deal with it in SceneServices?
    const gridItem = sceneGraph.getAncestor(this, SceneCSSGridItem);
    const timeseriesPanel = gridItem.state.body as VizPanel;
    const color = (timeseriesPanel.state.fieldConfig.defaults.color as FieldColor).fixedColor as string;

    sceneGraph.getAncestor(this, SceneServices).selectService(this.state.serviceName, color);
  };

  public static Component = ({ model }: SceneComponentProps<SelectServiceAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
