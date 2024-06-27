import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';
import { buildtimeSeriesPanelTitle } from '../../helpers/buildtimeSeriesPanelTitle';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneServiceFlameGraphState extends EmbeddedSceneState {}

export class SceneServiceFlameGraph extends SceneObjectBase<SceneServiceFlameGraphState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onVariableUpdateCompleted: () => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      timeSeriesPanel?.setState({ title: buildtimeSeriesPanelTitle(this) });
    },
  });

  static MIN_HEIGHT_TIMESERIES = 200;

  constructor() {
    super({
      key: 'explore-service-flame-graph',
      body: new SceneFlexLayout({
        direction: 'column',
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [
          new SceneFlexItem({
            minHeight: SceneServiceFlameGraph.MIN_HEIGHT_TIMESERIES,
            body: undefined,
          }),
          new SceneFlexItem({
            body: new SceneFlameGraph(),
          }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.buildTimeSeriesPanel();
  }

  async buildTimeSeriesPanel() {
    const headerActionItem = {
      index: 0,
      value: '',
      label: '',
      // let FavAction interpolate
      queryRunnerParams: {},
    };

    const timeSeriesPanel = PanelBuilders.timeseries()
      .setTitle(buildtimeSeriesPanelTitle(this))
      .setData(buildTimeSeriesQueryRunner({}))
      .setMin(0)
      .setColor({ mode: 'fixed', fixedColor: getColorByIndex(0) })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions([
        new SelectAction({ EventClass: EventViewServiceLabels, item: headerActionItem }),
        new FavAction({ item: headerActionItem }),
      ])
      .build();

    timeSeriesPanel.setState({ key: 'service-details-timeseries' });

    ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).setState({
      body: timeSeriesPanel,
    });
  }

  static Component({ model }: SceneComponentProps<SceneServiceFlameGraph>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
