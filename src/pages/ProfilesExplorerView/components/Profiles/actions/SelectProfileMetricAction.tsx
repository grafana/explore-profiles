import { FieldColor } from '@grafana/data';
import {
  SceneComponentProps,
  SceneCSSGridItem,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { SceneProfiles } from '../SceneProfiles';

interface SelectProfileMetricActionState extends SceneObjectState {
  profileMetric: { value: string; label: string };
}

export class SelectProfileMetricAction extends SceneObjectBase<SelectProfileMetricActionState> {
  public onClick = () => {
    // TODO: use a key on the panel and deal with it in SceneProfiles?
    const gridItem = sceneGraph.getAncestor(this, SceneCSSGridItem);
    const timeseriesPanel = gridItem.state.body as VizPanel;
    const color = (timeseriesPanel.state.fieldConfig.defaults.color as FieldColor).fixedColor as string;

    sceneGraph.getAncestor(this, SceneProfiles).selectProfileMetric(this.state.profileMetric, color);
  };

  public static Component = ({ model }: SceneComponentProps<SelectProfileMetricAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
