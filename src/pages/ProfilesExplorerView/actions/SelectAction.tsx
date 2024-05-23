import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

interface SelectActionState extends SceneObjectState {
  params: Record<string, string>;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  public onClick = () => {
    const { params } = this.state;
    const fullParams = {
      ...params,
      serviceName: params.serviceName || (sceneGraph.getVariables(this).getByName('serviceName')?.getValue() as string),
      profileMetricId:
        params.profileMetricId || (sceneGraph.getVariables(this).getByName('profileMetricId')?.getValue() as string),
    };

    console.log('*** SelectAction', fullParams);
  };

  public static Component = ({ model }: SceneComponentProps<SelectAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
