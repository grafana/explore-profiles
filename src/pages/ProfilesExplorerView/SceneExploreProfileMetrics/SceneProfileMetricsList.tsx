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
import { getProfileMetricQueryRunner } from '../data/getProfileMetricQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';

interface SceneProfileMetricsListState extends EmbeddedSceneState {
  profileMetrics: SceneProfilesExplorerState['profileMetrics'];
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneProfileMetricsList extends SceneObjectBase<SceneProfileMetricsListState> {
  constructor({ layout }: { layout: LayoutType }) {
    super({
      key: 'profile-metrics-list',
      profileMetrics: {
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
    if (!profileMetrics.isLoading && !profileMetrics.data.length) {
      (this.state.body as SceneCSSGridLayout).setState({
        autoRows: '480px',
        children: [
          new SceneCSSGridItem({
            body: new EmptyStateScene({
              message: 'No profile metrics found',
            }),
          }),
        ],
      });

      return;
    }

    const gridItems = profileMetrics.data.map(({ value: profileMetricId, label }, i) => {
      const serviceNameVariableValue = sceneGraph.lookupVariable('serviceName', this)?.getValue();
      const serviceName = typeof serviceNameVariableValue === 'string' ? serviceNameVariableValue : '';
      const color = getColorByIndex(i);
      const params = { serviceName, profileMetricId, color };

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(label)
          .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
          .setData(getProfileMetricQueryRunner({ profileMetricId }))
          .setColor({ mode: 'fixed', fixedColor: color })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([new SelectAction({ params }), new FavAction({ params })])
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
