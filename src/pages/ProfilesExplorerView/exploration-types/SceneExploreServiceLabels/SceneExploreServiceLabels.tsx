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

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { buildtimeSeriesPanelTitle } from '../../helpers/buildtimeSeriesPanelTitle';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { parseVariableValue } from '../../variables/FiltersVariable/filters-ops';
import { SceneGroupByLabels } from './SceneGroupByLabels';

interface SceneExploreServiceLabelsState extends EmbeddedSceneState {}

export class SceneExploreServiceLabels extends SceneObjectBase<SceneExploreServiceLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['dataSource', 'serviceName', 'profileMetricId', 'filters'],
    onVariableUpdateCompleted: () => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      const headerActionItem = this.buildHeaderActionItem();
      const headerActions = [
        new SelectAction({ EventClass: EventViewServiceFlameGraph, item: headerActionItem }),
        new FavAction({ item: headerActionItem }),
      ];

      timeSeriesPanel?.setState({
        title: buildtimeSeriesPanelTitle(this),
        headerActions,
      });
    },
  });

  static MIN_HEIGHT_TIMESERIES = 200;

  constructor() {
    super({
      key: 'explore-service-labels',
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
            minHeight: SceneExploreServiceLabels.MIN_HEIGHT_TIMESERIES,
            body: undefined,
          }),
          new SceneFlexItem({
            body: new SceneGroupByLabels(),
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
      .setTitle(buildtimeSeriesPanelTitle(this))
      .setData(buildTimeSeriesQueryRunner({}))
      .setMin(0)
      .setColor({ mode: 'fixed', fixedColor: getColorByIndex(0) })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions([
        new SelectAction({ EventClass: EventViewServiceFlameGraph, item: headerActionItem }),
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
      label: buildtimeSeriesPanelTitle(this),
      queryRunnerParams: {
        serviceName,
        profileMetricId,
        filters,
      },
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceLabels>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
