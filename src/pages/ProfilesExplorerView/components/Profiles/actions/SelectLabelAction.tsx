import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { ProfilesExplorer } from '../ProfilesExplorer';

export interface SelectLabelActionState extends SceneObjectState {
  // TODO: profileMetric: ProfileMetricOption;
  profileMetric: any;
  labelId: string;
  labelValues: string[];
}

export class SelectLabelAction extends SceneObjectBase<SelectLabelActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, ProfilesExplorer).selectLabel(this.state);
  };

  public static Component = ({ model }: SceneComponentProps<SelectLabelAction>) => {
    return (
      <Button variant="secondary" size="sm" fill="solid" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
