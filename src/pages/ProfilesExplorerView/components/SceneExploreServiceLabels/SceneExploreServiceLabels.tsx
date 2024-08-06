import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
} from '@grafana/scenes';
import React from 'react';

import { SceneMainServiceTimeseries } from '../../components/SceneMainServiceTimeseries';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneGroupByLabels } from './components/SceneGroupByLabels/SceneGroupByLabels';

interface SceneExploreServiceLabelsState extends EmbeddedSceneState {}

export class SceneExploreServiceLabels extends SceneObjectBase<SceneExploreServiceLabelsState> {
  constructor({ item }: { item?: GridItemData }) {
    super({
      key: 'explore-service-labels',
      body: new SceneFlexLayout({
        direction: 'column',
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [
          new SceneFlexItem({
            minHeight: SceneMainServiceTimeseries.MIN_HEIGHT,
            body: new SceneMainServiceTimeseries({
              headerActions: (item) => [
                new SelectAction({ EventClass: EventViewServiceProfiles, item }),
                new FavAction({ item }),
              ],
            }),
          }),
          new SceneFlexItem({
            body: new SceneGroupByLabels({ item }),
          }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    if (item) {
      this.initVariables(item);
    }

    const profileMetricVariable = findSceneObjectByClass(this, ProfileMetricVariable) as ProfileMetricVariable;

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    return () => {
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);
    };
  }

  initVariables(item: GridItemData) {
    const { queryRunnerParams } = item;
    const { serviceName, profileMetricId, filters } = queryRunnerParams;

    if (serviceName) {
      const serviceNameVariable = findSceneObjectByClass(this, ServiceNameVariable) as ServiceNameVariable;
      serviceNameVariable.changeValueTo(serviceName);
    }

    if (profileMetricId) {
      const profileMetricVariable = findSceneObjectByClass(this, ProfileMetricVariable) as ProfileMetricVariable;
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (filters) {
      const filtersVariable = findSceneObjectByClass(this, FiltersVariable) as FiltersVariable;
      filtersVariable.setState({ filters });
    }
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [
        findSceneObjectByClass(this, ServiceNameVariable) as ServiceNameVariable,
        findSceneObjectByClass(this, ProfileMetricVariable) as ProfileMetricVariable,
        findSceneObjectByClass(this, FiltersVariable) as FiltersVariable,
      ],
      gridControls: [],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceLabels>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
