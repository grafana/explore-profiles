import {
  SceneComponentProps,
  SceneCSSGridLayout,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import React from 'react';

import { SceneAiFlameGraphAnalysis } from './SceneAiFlameGraphAnalysis';
import { SceneFlameGraph } from './SceneFlameGraph';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '1600px';

interface SceneFlameGraphTabState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  body: SceneFlexLayout;
  drawerTitle?: string;
  drawerBody?: SceneObject;
}

export class SceneFlameGraphTab extends SceneObjectBase<SceneFlameGraphTabState> {
  constructor({ profileMetric }: { profileMetric: SceneFlameGraphTabState['profileMetric'] }) {
    super({
      profileMetric,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            // this is the only way I found to dipslay the flamegraph... dunno what I am missing :/
            body: new SceneCSSGridLayout({
              key: 'flameGraphGrid',
              templateColumns: GRID_TEMPLATE_COLUMNS,
              autoRows: GRID_AUTO_ROWS,
              children: [
                new SceneFlameGraph({
                  profileMetric,
                }),
              ],
            }),
          }),
        ],
      }),
    });
  }

  viewAiAnalysis() {
    const { profileMetric } = this.state;

    this.setState({
      drawerTitle: 'AI flame graph analysis',
      drawerBody: new SceneAiFlameGraphAnalysis({ profileMetric }),
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneFlameGraphTab>) => {
    const { body, drawerBody, drawerTitle } = model.useState();

    return (
      <div>
        <body.Component model={body} />
        {drawerBody && (
          <Drawer
            size="lg"
            title={drawerTitle}
            closeOnMaskClick
            onClose={() => model.setState({ drawerBody: undefined })}
          >
            <drawerBody.Component model={drawerBody} />
          </Drawer>
        )}
      </div>
    );
  };
}
