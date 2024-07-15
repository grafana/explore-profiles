import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Alert } from '@grafana/ui';
import React from 'react';

interface ErrorStateSceneState extends SceneObjectState {
  message: string;
}

export class ErrorStateScene extends SceneObjectBase<ErrorStateSceneState> {
  public static Component = ({ model }: SceneComponentProps<ErrorStateScene>) => {
    const { message } = model.useState();
    return (
      <Alert title="Query error" severity="error">
        {message}
      </Alert>
    );
  };
}
