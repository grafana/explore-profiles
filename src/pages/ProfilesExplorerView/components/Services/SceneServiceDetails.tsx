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
import { Button, Drawer } from '@grafana/ui';
import React from 'react';

import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { SceneServiceDetailsTabs } from './SceneServiceDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 240;

interface SceneServiceDetailsState extends SceneObjectState {
  serviceName: string;
  color: string;
  body?: SceneFlexLayout;
  isFlameGraphOpen?: boolean;
}

export class SceneServiceDetails extends SceneObjectBase<SceneServiceDetailsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetric'],
  });

  constructor(state: SceneServiceDetailsState) {
    const { serviceName, color } = state;

    super({
      serviceName,
      color,
      isFlameGraphOpen: false,
      body: new SceneFlexLayout({
        direction: 'column',
        minHeight: MIN_HEIGHT_TIMESERIES,
        children: [
          new SceneFlexItem({
            body: PanelBuilders.timeseries()
              .setTitle(serviceName)
              .setOption('legend', { showLegend: false })
              .setData(getServiceQueryRunner(serviceName))
              .setColor({ mode: 'fixed', fixedColor: color })
              .setCustomFieldConfig('fillOpacity', 9)
              .setHeaderActions(
                <Button variant="primary" size="sm" fill="text" onClick={() => this.viewFlameGraph()}>
                  🔥
                </Button>
              )
              .build(),
          }),
          new SceneFlexItem({
            body: new SceneServiceDetailsTabs({
              serviceName,
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

  public static Component = ({ model }: SceneComponentProps<SceneServiceDetails>) => {
    const { body, serviceName, isFlameGraphOpen } = model.useState();
    const profileMetricId = sceneGraph.lookupVariable('profileMetric', model)!.getValue() as string;

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
            subtitle={profileMetricId}
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
