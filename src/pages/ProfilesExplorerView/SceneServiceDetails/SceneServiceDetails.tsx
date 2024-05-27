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
import { DrawStyle } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';

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
          (
            sceneGraph.findObject(this, (o) => o instanceof ServiceNameVariable) as ServiceNameVariable
          )?.getValue() as string,
          (
            sceneGraph.findObject(this, (o) => o instanceof ProfileMetricVariable) as ServiceNameVariable
          )?.getValue() as string
        ),
      });
    },
  });

  constructor() {
    const color = getColorByIndex(0);

    super({
      key: 'service-details',
      body: new SceneFlexLayout({
        direction: 'row',
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: PanelBuilders.timeseries()
              .setTitle('')
              .setOption('legend', { showLegend: true })
              .setData(buildProfileQueryRunner({}))
              .setColor({ mode: 'fixed', fixedColor: color })
              .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
              .setCustomFieldConfig('fillOpacity', 100)
              .setCustomFieldConfig('lineWidth', 0)
              .setHeaderActions([new FavAction({ params: { color } })])
              .build(),
          }),
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: undefined,
          }),
        ],
      }),
    });

    this.addActivationHandler(() => {});
  }

  static buildtimeSeriesPanelTitle(serviceName: string, profileMetricId: string) {
    return `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
  }

  static Component({ model }: SceneComponentProps<SceneServiceDetails>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
