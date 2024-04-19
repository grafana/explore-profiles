import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState, SceneQueryRunner } from '@grafana/scenes';
import { IconButton } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from '../SceneBreakdownTab';

export interface ExpandActionState extends SceneObjectState {
  title: string;
  queryRunner: SceneQueryRunner;
  index: number;
  labelValues: string[];
}

export class ExpandAction extends SceneObjectBase<ExpandActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, SceneBreakdownTab).viewExpandedPanel(this.state);
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
