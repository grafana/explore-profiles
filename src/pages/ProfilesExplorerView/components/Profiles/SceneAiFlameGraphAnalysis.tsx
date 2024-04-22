import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon } from '@grafana/ui';
import React from 'react';

interface SceneAiFlameGraphAnalysisState extends SceneObjectState {
  profileMetric: { label: string; value: string };
}

export class SceneAiFlameGraphAnalysis extends SceneObjectBase<SceneAiFlameGraphAnalysisState> {
  constructor({ profileMetric }: { profileMetric: SceneAiFlameGraphAnalysisState['profileMetric'] }) {
    super({
      profileMetric,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneAiFlameGraphAnalysis>) => {
    const { profileMetric } = model.useState();

    console.log('*** SceneAiFlameGraphAnalysis', profileMetric);

    return (
      <div>
        <Icon name="ai" style={{ marginRight: '8px' }} />
        <em>Work-in-progress :)</em>
      </div>
    );
  };
}
