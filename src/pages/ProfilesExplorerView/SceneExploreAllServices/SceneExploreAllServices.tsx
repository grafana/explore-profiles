import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_SERVICES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventExplore } from '../events/EventExplore';
import { EventViewDetails } from '../events/EventViewDetails';

interface SceneExploreAllServicesState extends EmbeddedSceneState {}

export class SceneExploreAllServices extends SceneObjectBase<SceneExploreAllServicesState> {
  constructor() {
    super({
      key: 'explore-all-services',
      body: new SceneTimeSeriesGrid({
        key: 'all-services-grid',
        dataSource: PYROSCOPE_SERVICES_DATA_SOURCE,
        headerActions: (item) => [
          new SelectAction({ EventClass: EventExplore, item }),
          new SelectAction({ EventClass: EventViewDetails, item }),
          new FavAction({ item }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreAllServices>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
