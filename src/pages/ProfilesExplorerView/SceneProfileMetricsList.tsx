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

import { SelectServiceAction } from './actions/SelectServiceAction';
import { LayoutType } from './components/SceneLayoutSwitcher';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { getColorByIndex } from './helpers/getColorByIndex';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from './SceneProfilesExplorer';

interface SceneProfileMetricsListState extends EmbeddedSceneState {
  profileMetrics: SceneProfilesExplorerState['profileMetrics'];
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneProfileMetricsList extends SceneObjectBase<SceneProfileMetricsListState> {
  constructor({ layout }: { layout: LayoutType }) {
    super({
      key: 'services-list',
      profileMetrics: {
        data: [],
        isLoading: false,
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
        if (newState.profileMetrics !== prevState.profileMetrics) {
          this.updateProfileMetrics(newState.profileMetrics);
        }
      });
    });
  }

  updateProfileMetrics(profileMetrics: SceneProfileMetricsListState['profileMetrics']) {
    this.setState({ profileMetrics });
    this.updateGridItems(profileMetrics);
  }

  updateGridItems(profileMetrics: SceneProfileMetricsListState['profileMetrics']) {
    // TODO: render empty state

    const gridItems = ([] || profileMetrics).map((serviceName, i) => {
      const data = getServiceQueryRunner({ serviceName });

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(serviceName)
          .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
          .setData(data)
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            new SelectServiceAction({ serviceName }),
            // new FavAction({
            //   serviceName: service.value,
            //   labelId: '',
            // }),
          ])
          .build(),
      });
    });

    (this.state.body as SceneCSSGridLayout).setState({ children: gridItems });
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneCSSGridLayout).setState({
      templateColumns: newLayout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  onFilterChange(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const data = trimmedSearchText
      ? this.state.profileMetrics.data.filter(({ label }) => label.includes(trimmedSearchText))
      : this.state.profileMetrics.data;

    this.updateGridItems({
      data,
      isLoading: false,
      error: null,
    });
  }

  static Component({ model }: SceneComponentProps<SceneProfileMetricsList>) {
    const { body, profileMetrics } = model.useState();

    if (profileMetrics.isLoading) {
      return <Spinner />;
    }

    return <body.Component model={body} />;
  }
}
