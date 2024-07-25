import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { getColorByIndex } from '../helpers/getColorByIndex';
import { getSceneVariableValue } from '../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../infrastructure/series/helpers/getProfileMetricLabel';
import { buildTimeSeriesQueryRunner } from '../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { PanelType } from './SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneMainServiceTimeseriesState extends SceneObjectState {
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  body?: VizPanel;
}

export class SceneMainServiceTimeseries extends SceneObjectBase<SceneMainServiceTimeseriesState> {
  static MIN_HEIGHT = 200;

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['dataSource', 'serviceName', 'profileMetricId'],
    onVariableUpdateCompleted: () => {
      this.state.body?.setState({
        title: this.buildTitle(),
      });
    },
  });

  constructor({ headerActions }: { headerActions: SceneMainServiceTimeseriesState['headerActions'] }) {
    super({ headerActions });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const item = {
      index: 0,
      value: '',
      label: '',
      panelType: PanelType.TIMESERIES,
      // let actions interpolate the missing values
      queryRunnerParams: {},
    };

    const body = PanelBuilders.timeseries()
      .setTitle(this.buildTitle())
      .setData(buildTimeSeriesQueryRunner({}))
      .setMin(0)
      .setColor({ mode: 'fixed', fixedColor: getColorByIndex(0) })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions(this.state.headerActions(item))
      .build();

    body.setState({
      key: 'main-service-timeseries',
    });

    this.setState({ body });
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
