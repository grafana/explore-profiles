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
  serviceName: string;
  body: SceneFlexLayout;
  drawerTitle?: string;
  drawerBody?: SceneObject;
}

export class SceneFlameGraphTab extends SceneObjectBase<SceneFlameGraphTabState> {
  constructor({ serviceName }: { serviceName: SceneFlameGraphTabState['serviceName'] }) {
    super({
      serviceName,
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
                  serviceName,
                }),
              ],
            }),
          }),
        ],
      }),
    });
  }

  viewAiAnalysis() {
    const { serviceName } = this.state;

    this.setState({
      drawerTitle: 'AI flame graph analysis',
      drawerBody: new SceneAiFlameGraphAnalysis({ serviceName }),
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
