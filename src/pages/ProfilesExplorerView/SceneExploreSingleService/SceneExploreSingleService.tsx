import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';
import { PYROSCOPE_SERIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventViewServiceFlameGraph } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';

interface SceneExploreSingleServiceState extends EmbeddedSceneState {}

export class SceneExploreSingleService extends SceneObjectBase<SceneExploreSingleServiceState> {
  constructor() {
    super({
      key: 'explore-single-service',
      body: new SceneTimeSeriesGrid({
        key: 'profile-metrics-grid',
        query: {
          dataSource: PYROSCOPE_SERIES_DATA_SOURCE,
          target: 'profileMetricId',
        },
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new FavAction({ item }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreSingleService>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
