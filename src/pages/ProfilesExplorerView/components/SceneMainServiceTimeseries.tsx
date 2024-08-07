import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanelState,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { getSceneVariableValue } from '../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../infrastructure/series/helpers/getProfileMetricLabel';
import { PanelType } from './SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneLabelValuesTimeseries } from './SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';

interface SceneMainServiceTimeseriesState extends SceneObjectState {
  body?: SceneLabelValuesTimeseries;
}

export class SceneMainServiceTimeseries extends SceneObjectBase<SceneMainServiceTimeseriesState> {
  static MIN_HEIGHT = 200;

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId'],
    onVariableUpdateCompleted: () => {
      this.state.body?.updateTitle(this.buildTitle());
    },
  });

  constructor({ headerActions }: { headerActions: (item: GridItemData) => VizPanelState['headerActions'] }) {
    super({
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this, headerActions));
  }

  onActivate(headerActions: (item: GridItemData) => VizPanelState['headerActions']) {
    this.setState({
      body: new SceneLabelValuesTimeseries({
        item: {
          index: 0,
          value: '',
          label: this.buildTitle(),
          panelType: PanelType.TIMESERIES,
          // let actions interpolate the missing values
          queryRunnerParams: {},
        },
        headerActions,
      }),
    });
  }

  buildTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  static Component({ model }: SceneComponentProps<SceneMainServiceTimeseries>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
