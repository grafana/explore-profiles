import {
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { Button, Drawer, DrawStyle } from '@grafana/ui';
import React from 'react';

import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';
import { SceneProfileMetricDetailsTabs } from './SceneProfileMetricDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 200;

interface SceneProfileDetailsState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  color: string;
  body?: SceneFlexLayout;
  isFlameGraphOpen?: boolean;
}

export class SceneProfileDetails extends SceneObjectBase<SceneProfileDetailsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName'],
  });

  constructor(state: SceneProfileDetailsState) {
    const { profileMetric, color } = state;

    super({
      profileMetric,
      color,
      isFlameGraphOpen: false,
      body: new SceneFlexLayout({
        direction: 'column',
        minHeight: MIN_HEIGHT_TIMESERIES,
        children: [
          new SceneFlexItem({
            body: PanelBuilders.timeseries()
              .setTitle(profileMetric.label)
              .setOption('legend', { showLegend: false })
              .setData(getProfileMetricQueryRunner({ profileMetricId: profileMetric.value }))
              .setColor({ mode: 'fixed', fixedColor: color })
              // .setCustomFieldConfig('fillOpacity', 9)
              .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
              .setCustomFieldConfig('fillOpacity', 100)
              .setCustomFieldConfig('lineWidth', 0)
              .setHeaderActions(
                <Button variant="primary" size="sm" fill="text" onClick={() => this.viewFlameGraph()}>
                  🔥
                </Button>
              )
              .build(),
          }),
          new SceneFlexItem({
            body: new SceneProfileMetricDetailsTabs({
              profileMetric,
              activeTabId: 'breakdown',
            }),
          }),
        ],
      }),
    });
  }

  viewFlameGraph() {
    console.log('*** viewFlameGraph');

    this.setState({
      isFlameGraphOpen: true,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneProfileDetails>) => {
    const { body, profileMetric, isFlameGraphOpen } = model.useState();
    const serviceName = sceneGraph.lookupVariable('serviceName', model)!.getValue() as string;

    if (!body) {
      return null;
    }

    return (
      <>
        <body.Component model={body} />
        {isFlameGraphOpen && (
          <Drawer
            size="lg"
            title={`🔥 Flame graph for ${serviceName}`}
            subtitle={profileMetric.value}
            onClose={() => model.setState({ isFlameGraphOpen: false })}
          >
            <div>
              <em>Work-in-progress :)</em>
            </div>
          </Drawer>
        )}
      </>
    );
  };
}
