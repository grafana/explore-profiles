import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';

interface SceneExploreServiceProfileTypesState extends EmbeddedSceneState {}

export class SceneExploreServiceProfileTypes extends SceneObjectBase<SceneExploreServiceProfileTypesState> {
  constructor() {
    super({
      key: 'explore-service-profile-types',
      body: new SceneByVariableRepeaterGrid({
        key: 'profile-metrics-grid',
        variableName: 'profileMetricId',
        dependentVariableNames: ['serviceName'],
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new FavAction({ item }),
        ],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceProfileTypes>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}