import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Icon } from '@grafana/ui';
import React from 'react';

interface SelectLabelActionState extends SceneObjectState {
  labelId: string;
  tooltip?: string;
}

export class SelectLabelAction extends SceneObjectBase<SelectLabelActionState> {
  public onClick = () => {
    // TOOD: any
    (sceneGraph.findObject(this, (o) => o.state.key === 'breakdown-tab') as any)!.selectLabel(this.state.labelId);
  };

  public static Component = ({ model }: SceneComponentProps<SelectLabelAction>) => {
    const { tooltip } = model.useState();

    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick} tooltip={tooltip} tooltipPlacement="top">
        {tooltip && <Icon name="exclamation-circle" size="sm" />}&nbsp;Select
      </Button>
    );
  };
}
