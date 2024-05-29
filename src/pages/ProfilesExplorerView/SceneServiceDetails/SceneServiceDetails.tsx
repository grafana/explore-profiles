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
import { SceneExploreLabels } from '../components/SceneExploreLabels';
import { SceneFlameGraph } from '../components/SceneFlameGraph';
import { SceneTabs } from '../components/SceneTabs';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { getColorByIndex } from '../helpers/getColorByIndex';

interface SceneServiceDetailsState extends EmbeddedSceneState {}

const MIN_HEIGHT_TIMESERIES = 200;

export class SceneServiceDetails extends SceneObjectBase<SceneServiceDetailsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      timeSeriesPanel.setState({
        title: SceneServiceDetails.buildtimeSeriesPanelTitle(
          sceneGraph.lookupVariable('serviceName', this)?.getValue() as string,
          sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string
        ),
      });
    },
  });

  constructor() {
    const color = getColorByIndex(0);
    const timeSeriesPanel = PanelBuilders.timeseries()
      .setTitle('$serviceName')
      .setOption('legend', { showLegend: true })
      .setData(buildTimeSeriesQueryRunner({}))
      .setColor({ mode: 'fixed', fixedColor: color })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions([new FavAction({ params: { color } })])
      .build();

    timeSeriesPanel.setState({ key: 'service-details-timeseries' });

    super({
      key: 'service-details',
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
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: timeSeriesPanel,
          }),
          new SceneFlexItem({
            body: new SceneTabs({
              activeTabId: 'flame-graph',
              tabs: [
                {
                  id: 'flame-graph',
                  label: 'Flame graph',
                  content: new SceneFlameGraph(),
                },
                {
                  id: 'explore-labels',
                  label: 'Explore labels',
                  content: new SceneExploreLabels(),
                },
              ],
            }),
          }),
        ],
      }),
    });
  }

  static buildtimeSeriesPanelTitle(serviceName: string, profileMetricId: string) {
    return `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
  }

  static Component({ model }: SceneComponentProps<SceneServiceDetails>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
