import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { SceneMainServiceTimeseries } from '../../components/SceneMainServiceTimeseries';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventExpandPanel } from '../../domain/events/EventExpandPanel';
import { EventSelectLabel } from '../../domain/events/EventSelectLabel';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { vizPanelBuilder } from '../../helpers/vizPanelBuilder';
import { getProfileMetricLabel } from '../../infrastructure/series/helpers/getProfileMetricLabel';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../SceneDrawer';
import { SceneGroupByLabels } from './components/SceneGroupByLabels/SceneGroupByLabels';

interface SceneExploreServiceLabelsState extends SceneObjectState {
  body: SceneFlexLayout;
  drawer: SceneDrawer;
}

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
              item,
              headerActions: (item) => {
                return item.queryRunnerParams.groupBy
                  ? [
                      new SelectAction({ type: 'view-flame-graph', item }),
                      new SelectAction({
                        type: 'expand-panel',
                        item,
                      }),
                      new FavAction({ item }),
                    ]
                  : [new SelectAction({ type: 'view-flame-graph', item }), new FavAction({ item })];
              },
              supportGroupBy: true,
            }),
          }),
          new SceneFlexItem({
            body: new SceneGroupByLabels({ item }),
          }),
        ],
      }),
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    if (item) {
      this.initVariables(item);
    }

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    const panelEventsSub = this.subscribeToPanelEvents();

    return () => {
      panelEventsSub.unsubscribe();
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);
    };
  }

  initVariables(item: GridItemData) {
    const { queryRunnerParams } = item;
    const { serviceName, profileMetricId, filters } = queryRunnerParams;

    if (serviceName) {
      const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);
      serviceNameVariable.changeValueTo(serviceName);
    }

    if (profileMetricId) {
      const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (filters) {
      const filtersVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);
      filtersVariable.setState({ filters });
    }
  }

  subscribeToPanelEvents() {
    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, () => {
      // the event may be published from an expanded panel in the drawer
      this.state.drawer.close();
    });

    return {
      unsubscribe() {
        selectLabelSub.unsubscribe();
        expandPanelSub.unsubscribe();
      },
    };
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [
        sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable),
        sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable),
        sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable),
      ],
      gridControls: [],
    };
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const title = getSceneVariableValue(this, 'serviceName');

    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const profileMetricDescription =
      getProfileMetric(profileMetricId as ProfileMetricId).description || getProfileMetricLabel(profileMetricId);
    const timeseriesTitle = `${profileMetricDescription}, grouped by ${item.queryRunnerParams.groupBy?.label || '?'}`;

    this.state.drawer.open({
      title,
      body: vizPanelBuilder(item.panelType, {
        displayAllValues: true,
        legendPlacement: 'right',
        item: { ...item, label: timeseriesTitle },
        headerActions: () => [new SelectAction({ type: 'select-label', item }), new FavAction({ item })],
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceLabels>) {
    const { body, drawer } = model.useState();

    return (
      <>
        <body.Component model={body} />
        <drawer.Component model={drawer} />
      </>
    );
  }
}
