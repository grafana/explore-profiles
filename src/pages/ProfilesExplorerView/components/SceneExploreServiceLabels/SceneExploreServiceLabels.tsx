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

import { SceneMainServiceTimeseries } from '../../components/SceneMainServiceTimeseries';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { SceneGroupByLabels } from './SceneGroupByLabels';

interface SceneExploreServiceLabelsState extends EmbeddedSceneState {}

export class SceneExploreServiceLabels extends SceneObjectBase<SceneExploreServiceLabelsState> {
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
            minHeight: SceneMainServiceTimeseries.MIN_HEIGHT,
            body: new SceneMainServiceTimeseries({
              headerActions: (item) => [
                new SelectAction({ EventClass: EventViewServiceProfiles, item }),
                new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
                new FavAction({ item }),
              ],
            }),
          }),
          new SceneFlexItem({
            body: new SceneGroupByLabels(),
          }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceLabels>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
