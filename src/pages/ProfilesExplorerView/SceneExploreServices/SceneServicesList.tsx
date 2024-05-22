import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { EmptyStateScene } from '../components/EmptyState/EmptyStateScene';
import { LayoutType } from '../components/SceneLayoutSwitcher';
import { getServiceQueryRunner } from '../data/getServiceQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';

interface SceneServicesListState extends EmbeddedSceneState {
  services: SceneProfilesExplorerState['services'];
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneServicesList extends SceneObjectBase<SceneServicesListState> {
  constructor({ layout }: { layout: LayoutType }) {
    super({
      key: 'services-list',
      services: {
        data: [],
        isLoading: true,
        error: null,
      },
      body: new SceneCSSGridLayout({
        templateColumns: layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [],
      }),
    });

    this.addActivationHandler(() => {
      const ancestor = sceneGraph.getAncestor(this, SceneProfilesExplorer);

      ancestor.subscribeToState((newState, prevState) => {
        if (newState.services !== prevState.services) {
          this.updateServices(newState.services);
        }
      });
    });
  }

  updateServices(services: SceneServicesListState['services']) {
    this.setState({ services });
    this.updateGridItems(services);
  }

  updateGridItems(services: SceneServicesListState['services']) {
    if (!services.isLoading && !services.data.length) {
      (this.state.body as SceneCSSGridLayout).setState({
        autoRows: '480px',
        children: [
          new SceneCSSGridItem({
            body: new EmptyStateScene({
              message: 'No services found',
            }),
          }),
        ],
      });

      return;
    }

    const gridItems = services.data.map((serviceName, i) => {
      const profileMetricVariableValue = sceneGraph.lookupVariable('profileMetricId', this)?.getValue();
      const profileMetricId = typeof profileMetricVariableValue === 'string' ? profileMetricVariableValue : '';
      const color = getColorByIndex(i);
      const params = { serviceName, profileMetricId, color };

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(serviceName)
          .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
          .setData(getServiceQueryRunner({ serviceName }))
          .setColor({ mode: 'fixed', fixedColor: color })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([new SelectAction({ params }), new FavAction({ params })])
          .build(),
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS,
      children: gridItems,
    });
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneCSSGridLayout).setState({
      templateColumns: newLayout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  onFilterChange(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const data = trimmedSearchText
      ? this.state.services.data.filter((serviceName) => serviceName.includes(trimmedSearchText))
      : this.state.services.data;

    this.updateGridItems({
      data,
      isLoading: false,
      error: null,
    });
  }

  static Component({ model }: SceneComponentProps<SceneServicesList>) {
    const { body, services } = model.useState();

    if (services.isLoading) {
      return <Spinner />;
    }

    return <body.Component model={body} />;
  }
}
