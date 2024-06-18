import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventViewServiceFlameGraph } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';

interface SceneExploreFavoritesState extends EmbeddedSceneState {}

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    super({
      key: 'explore-favorites',
      body: new SceneTimeSeriesGrid({
        key: 'favorites-grid',
        dataSource: PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE,
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new FavAction({ item }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
