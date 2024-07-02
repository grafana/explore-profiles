import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
} from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneMainServiceTimeseries } from '../../components/SceneMainServiceTimeseries';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../../events/EventViewServiceProfiles';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneServiceFlameGraphState extends EmbeddedSceneState {}

export class SceneServiceFlameGraph extends SceneObjectBase<SceneServiceFlameGraphState> {
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
            minHeight: SceneMainServiceTimeseries.MIN_HEIGHT,
            body: new SceneMainServiceTimeseries({
              headerActions: (item) => [
                new SelectAction({ EventClass: EventViewServiceProfiles, item }),
                new SelectAction({ EventClass: EventViewServiceLabels, item }),
                new FavAction({ item }),
              ],
            }),
          }),
          new SceneFlexItem({
            body: new SceneFlameGraph(),
          }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneServiceFlameGraph>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
