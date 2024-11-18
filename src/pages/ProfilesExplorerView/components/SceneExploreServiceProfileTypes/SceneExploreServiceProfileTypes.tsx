import {
  EmbeddedSceneState,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneVariableSet,
} from '@grafana/scenes';
import React from 'react';

import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { PanelType } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
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
        mapOptionToItem: (option, index, { serviceName }) => ({
          index,
          value: option.value as string,
          label: option.label,
          queryRunnerParams: {
            serviceName,
            profileMetricId: option.value as string,
          },
          panelType: PanelType.TIMESERIES,
        }),
        headerActions: (item) => [
          new SelectAction({ type: 'view-labels', item }),
          new SelectAction({ type: 'view-flame-graph', item }),
          new FavAction({ item }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    sceneGraph
      .findByKeyAndType(this, 'quick-filter', SceneQuickFilter)
      .setPlaceholder('Search profile types (comma-separated regexes are supported)');

    if (item) {
      this.initVariables(item);
    }
  }

  initVariables(item: GridItemData) {
    if (item.queryRunnerParams.serviceName) {
      const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);
      serviceNameVariable.changeValueTo(item.queryRunnerParams.serviceName);
    }
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable)],
      gridControls: [
        sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter),
        sceneGraph.findByKeyAndType(this, 'layout-switcher', SceneLayoutSwitcher),
      ],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceProfileTypes>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
