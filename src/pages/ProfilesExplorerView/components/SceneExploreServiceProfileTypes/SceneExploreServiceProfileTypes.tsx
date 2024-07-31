import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase, SceneVariableSet } from '@grafana/scenes';
import React from 'react';

import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneExploreServiceProfileTypesState extends EmbeddedSceneState {}

export class SceneExploreServiceProfileTypes extends SceneObjectBase<SceneExploreServiceProfileTypesState> {
  constructor({ item }: { item?: GridItemData }) {
    super({
      key: 'explore-service-profile-types',
      $variables: new SceneVariableSet({
        variables: [
          // we use a custom instance of ProfileMetricVariable to display only the profile metrics associated to the selected service
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

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    const quickFilter = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    quickFilter.setPlaceholder('Search profile types (comma-separated regexes are supported)');

    if (item) {
      this.initVariables(item);
    }
  }

  initVariables(item: GridItemData) {
    if (item.queryRunnerParams.serviceName) {
      const serviceNameVariable = findSceneObjectByClass(this, ServiceNameVariable) as ServiceNameVariable;
      serviceNameVariable.changeValueTo(item.queryRunnerParams.serviceName);
    }
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [findSceneObjectByClass(this, ServiceNameVariable) as ServiceNameVariable],
      gridControls: [
        findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter,
        findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher,
      ],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceProfileTypes>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
