import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon } from '@grafana/ui';
import React from 'react';

interface SceneAiFlameGraphAnalysisState extends SceneObjectState {
  serviceName: string;
}

export class SceneAiFlameGraphAnalysis extends SceneObjectBase<SceneAiFlameGraphAnalysisState> {
  constructor({ serviceName }: { serviceName: string }) {
    super({
      serviceName,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneAiFlameGraphAnalysis>) => {
    const { serviceName } = model.useState();

    console.log('*** SceneAiFlameGraphAnalysis', serviceName);

    return (
      <div>
        <Icon name="ai" style={{ marginRight: '8px' }} />
        <em>Work-in-progress :)</em>
      </div>
    );
  };
}
