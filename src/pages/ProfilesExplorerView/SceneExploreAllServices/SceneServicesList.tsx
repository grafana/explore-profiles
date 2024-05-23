import { DashboardCursorSync, LoadingState } from '@grafana/data';
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
import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';

interface SceneServicesListState extends EmbeddedSceneState {
  services: SceneProfilesExplorerState['services'];
  hideNoData: boolean;
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
      hideNoData: false,
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
      const gridItemKey = `grid-item-${serviceName}`;

      const data = buildProfileQueryRunner({ serviceName });

      if (this.state.hideNoData) {
        this._subs.add(
          data.subscribeToState((state) => {
            if (state.data?.state === LoadingState.Done && !state.data.series.length) {
              const gridItem = sceneGraph.getAncestor(data, SceneCSSGridItem);
              const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);
              const { children } = grid.state;

              grid.setState({
                children: children.filter((c) => c.state.key !== gridItemKey),
              });
            }
          })
        );
      }

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: PanelBuilders.timeseries()
          .setTitle(serviceName)
          .setOption('legend', { showLegend: true }) // show profile metric ("cpu", etc.)
          .setData(data)
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

  onHideNoDataChange(newHideNoData: boolean) {
    this.setState({
      hideNoData: newHideNoData,
    });

    this.updateGridItems(this.state.services);
  }

  static Component({ model }: SceneComponentProps<SceneServicesList>) {
    const { body, services } = model.useState();

    if (services.isLoading) {
      return <Spinner />;
    }

    return <body.Component model={body} />;
  }
}
