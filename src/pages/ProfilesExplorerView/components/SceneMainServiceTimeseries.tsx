import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { timelineAndProfileApiClient } from '@shared/infrastructure/timelineAndProfileApiClient';
import React from 'react';

import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { buildtimeSeriesPanelTitle } from '../helpers/buildtimeSeriesPanelTitle';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer } from '../SceneProfilesExplorer';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';

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
        title: buildtimeSeriesPanelTitle(this),
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
      // let actions interpolate
      queryRunnerParams: {},
    };

    const body = PanelBuilders.timeseries()
      .setTitle(buildtimeSeriesPanelTitle(this))
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

    const globalTimeRangeState = findSceneObjectByClass(this, SceneProfilesExplorer).state.$timeRange;
    if (globalTimeRangeState) {
      timelineAndProfileApiClient.setLastTimeRange(globalTimeRangeState.state.value);
    }

    const timeRangeSubscription = globalTimeRangeState?.subscribeToState((newState) => {
      if (newState.value) {
        timelineAndProfileApiClient.setLastTimeRange(newState.value);
      }
    });

    return () => {
      timeRangeSubscription?.unsubscribe();
    };
  }

  static Component({ model }: SceneComponentProps<SceneMainServiceTimeseries>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
