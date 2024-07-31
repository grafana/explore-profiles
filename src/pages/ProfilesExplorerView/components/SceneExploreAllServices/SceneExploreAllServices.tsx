import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase, SceneVariableSet } from '@grafana/scenes';
import React from 'react';

import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';

interface SceneExploreAllServicesState extends EmbeddedSceneState {}

export class SceneExploreAllServices extends SceneObjectBase<SceneExploreAllServicesState> {
  constructor() {
    super({
      key: 'explore-all-services',
      $variables: new SceneVariableSet({
        variables: [
          // we use a custom instance of ServiceNameVariable to display only the services associated to the selected profile metric
          new ServiceNameVariable({
            query: ServiceNameVariable.QUERY_PROFILE_METRIC_DEPENDENT,
            skipUrlSync: true,
          }),
        ],
      }),
      body: new SceneByVariableRepeaterGrid({
        key: 'all-services-grid',
        variableName: 'serviceName',
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceProfiles, item }),
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new FavAction({ item }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const quickFilter = findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter;
    quickFilter.setPlaceholder('Search services (comma-separated regexes are supported)');
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [findSceneObjectByClass(this, ProfileMetricVariable) as ProfileMetricVariable],
      gridControls: [
        findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter,
        findSceneObjectByClass(this, SceneLayoutSwitcher) as SceneLayoutSwitcher,
      ],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreAllServices>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
