import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneFlameGraphTab } from '../SceneFlameGraphTab';

export interface ViewAiAnalysisActionState extends SceneObjectState {}

export class ViewAiAnalysisAction extends SceneObjectBase<ViewAiAnalysisActionState> {
  public onClick = () => {
    // TODO: find object by key instead to DRY here and in Profiles scenes
    sceneGraph.getAncestor(this, SceneFlameGraphTab).viewAiAnalysis();
  };

  public static Component = ({ model }: SceneComponentProps<ViewAiAnalysisAction>) => {
    return (
      <Button icon="ai" variant="primary" size="sm" fill="text" onClick={model.onClick}>
        View AI analysis
      </Button>
    );
  };
}
