import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { EmptyState } from './ui/EmptyState';

interface SceneEmptyStateState extends SceneObjectState {
  message: string;
}

export class SceneEmptyState extends SceneObjectBase<SceneEmptyStateState> {
  public static Component = ({ model }: SceneComponentProps<SceneEmptyState>) => {
    const { message } = model.useState();
    return <EmptyState message={message} />;
  };
}
