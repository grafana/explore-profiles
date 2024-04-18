import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { ProfilesExplorer } from '../ProfilesExplorer';

export interface SelectProfileMetricActionState extends SceneObjectState {
  // TODO: profileMetric: ProfileMetricOption;
  profileMetric: any;
}

export class SelectProfileMetricAction extends SceneObjectBase<SelectProfileMetricActionState> {
  public onClick = () => {
    sceneGraph.getAncestor(this, ProfilesExplorer).selectProfileMetric(this.state);
  };

  public static Component = ({ model }: SceneComponentProps<SelectProfileMetricAction>) => {
    return (
      <Button variant="secondary" size="sm" fill="solid" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
