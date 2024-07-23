import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase, SceneVariableSet } from '@grafana/scenes';
import React from 'react';

import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';

interface SceneExploreServiceProfileTypesState extends EmbeddedSceneState {}

export class SceneExploreServiceProfileTypes extends SceneObjectBase<SceneExploreServiceProfileTypesState> {
  constructor() {
    super({
      key: 'explore-service-profile-types',
      $variables: new SceneVariableSet({
        variables: [
          // use a custom instance of ProfileMetricVariable to display only the profile metrics associtaed to the selected service
          new ProfileMetricVariable({
            query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT,
            skipUrlSync: true,
          }),
        ],
      }),
      body: new SceneByVariableRepeaterGrid({
        key: 'profile-metrics-grid',
        variableName: 'profileMetricId',
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
