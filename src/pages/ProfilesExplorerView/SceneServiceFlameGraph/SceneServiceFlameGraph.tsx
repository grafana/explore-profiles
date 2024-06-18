import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { parseVariableValue } from '../variables/FiltersVariable/filters-ops';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneServiceFlameGraphState extends EmbeddedSceneState {}

export class SceneServiceFlameGraph extends SceneObjectBase<SceneServiceFlameGraphState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId', 'filters'],
    onReferencedVariableValueChanged: (variable) => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      const headerActionItem = this.buildHeaderActionItem();
      const headerActions = [
        new SelectAction({ EventClass: EventViewServiceLabels, item: headerActionItem }),
        new FavAction({ item: headerActionItem }),
      ];

      const newState =
        variable.state.name === 'filters'
          ? { headerActions }
          : {
              title: this.buildtimeSeriesPanelTitle(),
              headerActions,
            };

      timeSeriesPanel?.setState(newState);
    },
  });

  static MIN_HEIGHT_TIMESERIES = 200;

  constructor() {
    super({
      key: 'service-flame-graph',
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
    const headerActionItem = this.buildHeaderActionItem();

    const timeSeriesPanel = PanelBuilders.timeseries()
      .setTitle(this.buildtimeSeriesPanelTitle())
      .setData(buildTimeSeriesQueryRunner({}))
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

  buildHeaderActionItem() {
    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;

    const filtersVariableValue = sceneGraph.lookupVariable('filters', this)?.getValue() as string;
    const filters = parseVariableValue(filtersVariableValue);

    return {
      index: 0,
      value: `${serviceName}-${profileMetricId}-${filtersVariableValue}`,
      label: this.buildtimeSeriesPanelTitle(),
      queryRunnerParams: {
        serviceName,
        profileMetricId,
        filters,
      },
    };
  }

  buildtimeSeriesPanelTitle() {
    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;

    return `${serviceName || '?'} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
  }

  static Component({ model }: SceneComponentProps<SceneServiceFlameGraph>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
