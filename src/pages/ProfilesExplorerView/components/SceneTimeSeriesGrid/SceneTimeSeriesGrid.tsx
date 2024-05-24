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
  SceneQueryRunner,
  VariableDependencyConfig,
  VizPanelState,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';

import { EmptyStateScene } from '../../components/EmptyState/EmptyStateScene';
import { LayoutType, SceneLayoutSwitcher } from '../../components/SceneLayoutSwitcher';
import { buildProfileQueryRunner } from '../../data/buildProfileQueryRunner';
import {
  PYROSCOPE_PROFILE_METRICS_DATA_SOURCE,
  PYROSCOPE_SERVICES_DATA_SOURCE,
} from '../../data/pyroscope-data-source';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { SceneNoDataSwitcher } from '../SceneNoDataSwitcher';

interface SceneTimeSeriesGridState extends EmbeddedSceneState {
  headerActions: (params: Record<string, any>) => VizPanelState['headerActions'];
  dataSource?: {
    type: string;
    uid: string;
  };
  items: {
    data: Array<{
      label: string;
      value: string;
      color?: string;
      queryRunnerParams: Record<string, any>;
    }>;
    isLoading: boolean;
    error: Error | null;
  };
  hideNoData: boolean;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneTimeSeriesGrid extends SceneObjectBase<SceneTimeSeriesGridState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      const noDataSwitcher = sceneGraph.findObject(this, (o) => o.state.key === 'no-data-switcher');

      if ((noDataSwitcher as SceneNoDataSwitcher)?.state?.hideNoData) {
        // if we don't do this, we get stuck with the previous grid that might not include the items that had no data before
        // but that now have data after the variable update
        this.updateGridItems(this.state.items);
      }
    },
  });

  // TODO
  // eslint-disable-next-line sonarjs/cognitive-complexity
  constructor({
    key,
    headerActions,
    items,
    dataSource,
  }: {
    key: string;
    items?: SceneTimeSeriesGridState['items'];
    headerActions: SceneTimeSeriesGridState['headerActions'];
    dataSource?: SceneTimeSeriesGridState['dataSource'];
  }) {
    const layout = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.layout || SceneLayoutSwitcher.DEFAULT_LAYOUT;

    super({
      key,
      dataSource,
      items: items || {
        data: [],
        isLoading: true,
        error: null,
      },
      hideNoData: false,
      headerActions,
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

    // TODO: extract to several methods
    this.addActivationHandler(() => {
      if (dataSource) {
        const profileMetricsQueryRunner = new SceneQueryRunner({
          datasource: dataSource,
          queries: [
            {
              refId: `${dataSource.type}-${key}`,
              queryType: 'metrics',
            },
          ],
        });

        const sub = profileMetricsQueryRunner.subscribeToState((newState) => {
          if (newState.data?.state === LoadingState.Error) {
            sub.unsubscribe();

            this.updateItems({
              data: [],
              isLoading: false,
              error: new Error(newState.data?.errors?.[0].message || 'Unknown error!'),
            });
            return;
          }

          if (newState.data?.state === LoadingState.Done) {
            sub.unsubscribe();

            if (dataSource.uid === PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.uid) {
              const data = newState.data?.series[0].fields[0].values.map((value) => {
                const profileMetric = getProfileMetric(value as ProfileMetricId);
                const { group, type } = profileMetric;

                return {
                  value,
                  label: `${type} (${group})`,
                  queryRunnerParams: {
                    profileMetricId: value,
                  },
                };
              });

              this.updateItems({ data, isLoading: false, error: null });
            } else if (dataSource.uid === PYROSCOPE_SERVICES_DATA_SOURCE.uid) {
              const data = newState.data?.series[0].fields[0].values.map((value) => {
                return {
                  value,
                  label: value,
                  queryRunnerParams: {
                    serviceName: value,
                  },
                };
              });

              this.updateItems({ data, isLoading: false, error: null });
            }
          }
        });

        profileMetricsQueryRunner.runQueries();
      }
    });
  }

  updateItems(items: SceneTimeSeriesGridState['items']) {
    this.setState({ items });
    this.updateGridItems(items);
  }

  renderEmptyState() {
    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: '480px',
      children: [
        new SceneCSSGridItem({
          body: new EmptyStateScene({
            message: 'No results',
          }),
        }),
      ],
    });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateGridItems(items: SceneTimeSeriesGridState['items']) {
    const gridItems = items.data.map((item, i) => {
      const gridItemKey = `grid-item-${item.value}`;
      const color = item.color || getColorByIndex(i);
      const actionParams = { ...item.queryRunnerParams, color };

      const data = buildProfileQueryRunner(item.queryRunnerParams);

      if (this.state.hideNoData) {
        this._subs.add(
          data.subscribeToState((state) => {
            if (state.data?.state === LoadingState.Done && !state.data.series.length) {
              const gridItem = sceneGraph.getAncestor(data, SceneCSSGridItem);
              const grid = sceneGraph.getAncestor(gridItem, SceneCSSGridLayout);
              const filteredChildren = grid.state.children.filter((c) => c.state.key !== gridItemKey);

              if (filteredChildren.length) {
                grid.setState({ children: filteredChildren });
              } else {
                this.renderEmptyState();
              }
            }
          })
        );
      }

      return new SceneCSSGridItem({
        key: gridItemKey,
        body: PanelBuilders.timeseries()
          .setTitle(item.label)
          .setOption('legend', { showLegend: true })
          .setData(data)
          .setColor({ mode: 'fixed', fixedColor: color })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions(this.state.headerActions(actionParams))
          .build(),
      });
    });

    if (!gridItems.length) {
      this.renderEmptyState();
      return;
    }

    (this.state.body as SceneCSSGridLayout).setState({
      autoRows: GRID_AUTO_ROWS,
      children: gridItems,
    });
  }

  updateFilter(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const filteredData = trimmedSearchText
      ? this.state.items.data.filter(({ label }) => label.includes(trimmedSearchText))
      : this.state.items.data;

    this.updateGridItems({
      data: filteredData,
      isLoading: false,
      error: null,
    });
  }

  updateLayout(layout: string) {
    (this.state.body as SceneCSSGridLayout).setState({
      templateColumns: layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  updateHideNoData(newHideNoData: boolean) {
    this.setState({ hideNoData: newHideNoData });
    this.updateGridItems(this.state.items);
  }

  static Component({ model }: SceneComponentProps<SceneTimeSeriesGrid>) {
    const { body, items } = model.useState();

    return items.isLoading ? <Spinner /> : <body.Component model={body} />;
  }
}
