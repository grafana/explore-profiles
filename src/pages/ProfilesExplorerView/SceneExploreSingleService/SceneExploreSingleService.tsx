import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_PROFILE_METRICS_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventViewDetails } from '../events/EventViewDetails';

interface SceneExploreSingleServiceState extends EmbeddedSceneState {}

export class SceneExploreSingleService extends SceneObjectBase<SceneExploreSingleServiceState> {
  constructor() {
    super({
      key: 'explore-single-service',
      body: new SceneTimeSeriesGrid({
        key: 'profile-metrics-grid',
        dataSource: PYROSCOPE_PROFILE_METRICS_DATA_SOURCE,
        headerActions: (item) => [new SelectAction({ EventClass: EventViewDetails, item }), new FavAction({ item })],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreSingleService>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
