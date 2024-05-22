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
import { getProfileMetricQueryRunner } from '../data/getProfileMetricQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';

interface SceneProfileMetricsListState extends EmbeddedSceneState {
  profileMetrics: SceneProfilesExplorerState['profileMetrics'];
  hideNoData: boolean;
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
      const gridItemKey = `grid-item-${profileMetricId}`;

      const data = getProfileMetricQueryRunner({ profileMetricId });

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
          .setTitle(label)
          .setOption('legend', { showLegend: true }) // show profile metric ("cpu", etc.)
          .setData(data)
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

  onHideNoDataChange(newHideNoData: boolean) {
    this.setState({
      hideNoData: newHideNoData,
    });

    this.updateGridItems(this.state.profileMetrics);
  }

  static Component({ model }: SceneComponentProps<SceneProfileMetricsList>) {
    const { body, profileMetrics } = model.useState();

    if (profileMetrics.isLoading) {
      return <Spinner />;
    }

    return <body.Component model={body} />;
  }
}
