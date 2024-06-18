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
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneGroupByLabels } from './SceneGroupByLabels';

interface SceneExploreServiceLabelsState extends EmbeddedSceneState {}

export class SceneExploreServiceLabels extends SceneObjectBase<SceneExploreServiceLabelsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      timeSeriesPanel?.setState({
        title: this.buildtimeSeriesPanelTitle(),
        headerActions: [
          new FavAction({
            item: this.buildFavActionItem(),
          }),
        ],
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
    const timeSeriesPanel = PanelBuilders.timeseries()
      .setTitle(this.buildtimeSeriesPanelTitle())
      .setData(buildTimeSeriesQueryRunner({}))
      .setColor({ mode: 'fixed', fixedColor: getColorByIndex(0) })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions([
        new FavAction({
          item: this.buildFavActionItem(),
        }),
      ])
      .build();

    timeSeriesPanel.setState({ key: 'service-details-timeseries' });

    ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).setState({
      body: timeSeriesPanel,
    });
  }

  buildFavActionItem() {
    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;

    return {
      index: 0,
      value: `${serviceName}-${profileMetricId}`,
      label: this.buildtimeSeriesPanelTitle(),
      queryRunnerParams: {
        serviceName,
        profileMetricId,
      },
    };
  }

  buildtimeSeriesPanelTitle() {
    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;

    return `${serviceName || '?'} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceLabels>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
