import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { IconButton } from '@grafana/ui';
import React from 'react';

export interface ExpandActionState extends SceneObjectState {
  panelKey: string;
}

export class ExpandAction extends SceneObjectBase<ExpandActionState> {
  public onClick = () => {
    // TOOD: any
    (sceneGraph.findObject(this, (o) => o.state.key === 'breakdown-tab') as any)!.viewExpandedPanel(this.state);
  };

  public static Component = ({ model }: SceneComponentProps<ExpandAction>) => {
    return (
      <IconButton
        name="expand-arrows"
        variant="secondary"
        size="xs"
        aria-label="Expand panel"
        tooltip="Expand panel"
        tooltipPlacement="top"
        onClick={model.onClick}
      />
    );
  };
}
