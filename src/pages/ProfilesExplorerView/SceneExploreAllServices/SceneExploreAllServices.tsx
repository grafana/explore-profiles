import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_SERVICES_DATA_SOURCE } from '../data/pyroscope-data-source';

interface SceneExploreAllServicesState extends EmbeddedSceneState {}

export class SceneExploreAllServices extends SceneObjectBase<SceneExploreAllServicesState> {
  constructor() {
    super({
      key: 'explore-all-services',
      body: new SceneTimeSeriesGrid({
        key: 'all-services-grid',
        dataSource: PYROSCOPE_SERVICES_DATA_SOURCE,
        headerActions: (params) => [
          new SelectAction({ eventClass: 'EventExplore', params }),
          new SelectAction({ eventClass: 'EventViewDetails', params }),
          new FavAction({ params }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreAllServices>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
