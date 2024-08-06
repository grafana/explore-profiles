import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Alert } from '@grafana/ui';
import React from 'react';

interface SceneErrorStateState extends SceneObjectState {
  message: string;
}

export class SceneErrorState extends SceneObjectBase<SceneErrorStateState> {
  public static Component = ({ model }: SceneComponentProps<SceneErrorState>) => {
    const { message } = model.useState();
    return (
      <Alert title="Query error!" severity="error">
        {message}
      </Alert>
    );
  };
}
