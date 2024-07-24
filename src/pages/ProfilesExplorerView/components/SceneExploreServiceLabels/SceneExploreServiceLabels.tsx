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
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { ScenePanelTypeSwitcher } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneGroupByLabels } from './SceneGroupByLabels';

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
                new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
                new FavAction({ item }),
              ],
            }),
          }),
          new SceneFlexItem({
            body: new SceneGroupByLabels(),
          }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    if (item) {
      this.initVariablesAndControls(item);
    }

    const profileMetricVariable = findSceneObjectByClass(this, ProfileMetricVariable) as ProfileMetricVariable;

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    return () => {
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  initVariablesAndControls(item: GridItemData) {
    const { queryRunnerParams, panelType } = item;
    const { serviceName, profileMetricId, filters, groupBy } = queryRunnerParams;

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

    if (groupBy?.label) {
      const groupByVariable = findSceneObjectByClass(this, GroupByVariable) as GroupByVariable;

      // because (to the contrary of the "Series" data) we don't load labels if the groupBy variable is not active
      // (see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts)
      // we have to wait until the new groupBy options have been loaded
      // if not, its value will default to "all" regardless of our call to "changeValueTo"
      // this happens, e.g., when landing on "Favorites" then jumping to "Labels" by clicking on a favorite that contains a "groupBy" label value
      const groupBySub = groupByVariable.subscribeToState((newState, prevState) => {
        if (!newState.loading && prevState.loading) {
          groupByVariable.changeValueTo(groupBy.label);
          groupBySub.unsubscribe();
        }
      });
    }

    if (panelType) {
      const panelTypeSwitcher = findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher;
      panelTypeSwitcher.setState({ panelType });
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
