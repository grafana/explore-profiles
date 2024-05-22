import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

interface SelectActionState extends SceneObjectState {
  params: Record<string, string>;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  public onClick = () => {
    console.log('*** SelectAction', this.state.params);
  };

  public static Component = ({ model }: SceneComponentProps<SelectAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
